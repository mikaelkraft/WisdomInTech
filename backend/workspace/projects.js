const { json, error, getUrl } = require("../_lib/respond.js");
const { query } = require("../_lib/db.js");
const { getJsonBody } = require("../_lib/body.js");
const { getUserWithRole } = require("../_lib/auth.js");

module.exports = async function handler(req, res) {
  try {
    const me = await getUserWithRole(req);
    if (!me) return error(res, "Unauthorized", 401);

    const url = getUrl(req);

    // GET /api/workspace/projects: List projects owned or collaborated on
    if (req.method === "GET") {
      const sql = `
        SELECT DISTINCT p.id, p.title, p.description, p.featured_image, p.gallery_images,
               p.type, p.video_url, p.tags, p.category, p.status, p.featured,
               p.view_count, p.like_count, p.author_id, p.created_at, p.updated_at,
               u.full_name as author_name, u.username as author_username, u.avatar_url as author_avatar,
               COALESCE(pm.role, CASE WHEN p.author_id = $1 THEN 'owner' ELSE 'member' END) as user_role,
               (
                 SELECT json_agg(json_build_object(
                   'id', r.id,
                   'provider', r.provider,
                   'repoUrl', r.repo_url,
                   'repoFullName', r.repo_full_name,
                   'defaultBranch', r.default_branch,
                   'lastSyncedAt', r.last_synced_at,
                   'syncMetadata', r.sync_metadata
                 ))
                 FROM wisdomintech.project_repositories r
                 WHERE r.project_id = p.id
               ) as connected_repos,
               (
                 SELECT count(*)::int
                 FROM wisdomintech.project_agent_tasks t
                 WHERE t.project_id = p.id
               ) as agent_task_count
        FROM wisdomintech.projects p
        LEFT JOIN wisdomintech.user_profiles u ON u.id = p.author_id
        LEFT JOIN wisdomintech.project_members pm ON pm.project_id = p.id AND pm.user_id = $1
        WHERE (p.author_id = $1 OR pm.user_id = $1 OR me.role = 'admin')
          AND (p.deleted_at IS NULL)
        ORDER BY p.updated_at DESC
      `;
      const { rows } = await query(sql, [me.id]);

      const projects = rows.map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        featuredImage: r.featured_image,
        galleryImages: r.gallery_images || [],
        type: r.type || "image",
        videoUrl: r.video_url,
        tags: r.tags || [],
        category: r.category || "General",
        status: r.status || "draft",
        featured: Boolean(r.featured),
        views: r.view_count || 0,
        likes: r.like_count || 0,
        authorId: r.author_id,
        authorName: r.author_name || r.author_username || "Unknown",
        authorUsername: r.author_username,
        authorAvatar: r.author_avatar,
        userRole: r.user_role,
        connectedRepos: r.connected_repos || [],
        agentTaskCount: r.agent_task_count || 0,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }));

      // Calculate workspace summary statistics
      const stats = {
        totalProjects: projects.length,
        published: projects.filter((p) => p.status === "published").length,
        drafts: projects.filter((p) => p.status === "draft").length,
        totalViews: projects.reduce((acc, c) => acc + (c.views || 0), 0),
        totalLikes: projects.reduce((acc, c) => acc + (c.likes || 0), 0),
        reposConnected: projects.reduce(
          (acc, c) => acc + (c.connectedRepos ? c.connectedRepos.length : 0),
          0,
        ),
      };

      return json(res, { stats, projects });
    }

    // POST /api/workspace/projects: Create new project
    if (req.method === "POST") {
      const body = await getJsonBody(req);
      const title = (body.title || "").trim();
      if (!title) return error(res, "Project title is required", 400);

      const description = body.description || "";
      const featuredImage = body.featuredImage || body.featured_image || null;
      const galleryImages = Array.isArray(body.galleryImages)
        ? JSON.stringify(body.galleryImages)
        : "[]";
      const type = body.type || "image";
      const videoUrl = body.videoUrl || null;
      const tags = Array.isArray(body.tags) ? body.tags : [];
      const category = body.category || "General";
      const status = body.status === "published" ? "published" : "draft";

      const insertSql = `
        INSERT INTO wisdomintech.projects (
          title, description, featured_image, gallery_images, type, video_url,
          tags, category, status, author_id
        ) VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, $8, $9, $10)
        RETURNING id, title, description, featured_image, tags, category, status, created_at
      `;
      const { rows } = await query(insertSql, [
        title,
        description,
        featuredImage,
        galleryImages,
        type,
        videoUrl,
        tags,
        category,
        status,
        me.id,
      ]);

      const created = rows[0];

      // Automatically add author as 'owner' in project_members
      await query(
        `INSERT INTO wisdomintech.project_members (project_id, user_id, role)
         VALUES ($1, $2, 'owner')
         ON CONFLICT (project_id, user_id) DO NOTHING`,
        [created.id, me.id],
      );

      // If repo info was provided in body, link it
      if (body.repoUrl && body.repoFullName) {
        await query(
          `INSERT INTO wisdomintech.project_repositories (
             project_id, provider, repo_url, repo_full_name, default_branch
           ) VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (project_id, repo_url) DO NOTHING`,
          [
            created.id,
            body.repoProvider || "github",
            body.repoUrl,
            body.repoFullName,
            body.defaultBranch || "main",
          ],
        );
      }

      return json(res, { success: true, project: created }, 201);
    }

    // PUT /api/workspace/projects: Update project
    if (req.method === "PUT") {
      const body = await getJsonBody(req);
      const projectId = body.id || url.searchParams.get("id");
      if (!projectId) return error(res, "Missing project ID", 400);

      // Verify permission: owner, editor, or admin
      const { rows: permRows } = await query(
        `SELECT p.id, p.author_id, pm.role as member_role
         FROM wisdomintech.projects p
         LEFT JOIN wisdomintech.project_members pm ON pm.project_id = p.id AND pm.user_id = $1
         WHERE p.id = $2`,
        [me.id, projectId],
      );

      if (!permRows.length) return error(res, "Project not found", 404);
      const isOwner = permRows[0].author_id === me.id;
      const isEditor = ["owner", "editor"].includes(permRows[0].member_role);
      const isAdmin = me.role === "admin";

      if (!isOwner && !isEditor && !isAdmin) {
        return error(res, "You do not have permission to edit this project", 403);
      }

      const sets = [];
      const params = [projectId];
      let i = 2;

      const updatable = [
        "title",
        "description",
        "featured_image",
        "type",
        "video_url",
        "category",
        "status",
      ];

      for (const field of updatable) {
        const camel = field.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
        if (field in body || camel in body) {
          const val = body[field] !== undefined ? body[field] : body[camel];
          sets.push(`${field} = $${i}`);
          params.push(val);
          i++;
        }
      }

      if (Array.isArray(body.tags)) {
        sets.push(`tags = $${i}`);
        params.push(body.tags);
        i++;
      }

      if (Array.isArray(body.galleryImages)) {
        sets.push(`gallery_images = $${i}::jsonb`);
        params.push(JSON.stringify(body.galleryImages));
        i++;
      }

      if (!sets.length) {
        return error(res, "No fields to update", 400);
      }

      sets.push("updated_at = now()");
      const updateSql = `UPDATE wisdomintech.projects SET ${sets.join(", ")} WHERE id = $1 RETURNING id, title, status, updated_at`;
      const { rows: updated } = await query(updateSql, params);

      return json(res, { success: true, project: updated[0] });
    }

    // DELETE /api/workspace/projects: Soft delete or remove project
    if (req.method === "DELETE") {
      const projectId = url.searchParams.get("id");
      if (!projectId) return error(res, "Missing project ID", 400);

      // Only owner or admin can delete
      const { rows: check } = await query(
        `SELECT id, author_id FROM wisdomintech.projects WHERE id = $1`,
        [projectId],
      );
      if (!check.length) return error(res, "Project not found", 404);

      if (check[0].author_id !== me.id && me.role !== "admin") {
        return error(res, "Only the project owner can delete this project", 403);
      }

      await query(
        `UPDATE wisdomintech.projects SET deleted_at = now() WHERE id = $1`,
        [projectId],
      );
      return json(res, { success: true, id: projectId });
    }

    return error(res, "Method not allowed", 405);
  } catch (err) {
    return error(res, "Workspace project operation failed", 500, {
      detail: err.message,
    });
  }
};
