const { json, error, getUrl } = require("../_lib/respond.js");
const { query } = require("../_lib/db.js");
const { getJsonBody } = require("../_lib/body.js");
const { getUserWithRole } = require("../_lib/auth.js");

module.exports = async function handler(req, res) {
  try {
    const me = await getUserWithRole(req);
    if (!me) return error(res, "Unauthorized", 401);

    const url = getUrl(req);

    // GET /api/workspace/repos?projectId=...
    if (req.method === "GET") {
      const projectId = url.searchParams.get("projectId");
      if (!projectId) return error(res, "Missing projectId query parameter", 400);

      const { rows } = await query(
        `SELECT id, project_id, provider, repo_url, repo_full_name, default_branch,
                last_synced_at, sync_metadata, created_at
         FROM wisdomintech.project_repositories
         WHERE project_id = $1
         ORDER BY created_at DESC`,
        [projectId],
      );

      return json(res, {
        repos: rows.map((r) => ({
          id: r.id,
          projectId: r.project_id,
          provider: r.provider,
          repoUrl: r.repo_url,
          repoFullName: r.repo_full_name,
          defaultBranch: r.default_branch,
          lastSyncedAt: r.last_synced_at,
          syncMetadata: r.sync_metadata || {},
          createdAt: r.created_at,
        })),
      });
    }

    // POST /api/workspace/repos: Link a new repository
    if (req.method === "POST") {
      const body = await getJsonBody(req);
      const projectId = body.projectId;
      let repoUrl = (body.repoUrl || "").trim();

      if (!projectId || !repoUrl) {
        return error(res, "projectId and repoUrl are required", 400);
      }

      // Verify project edit permission
      const { rows: perm } = await query(
        `SELECT p.id, p.author_id, pm.role
         FROM wisdomintech.projects p
         LEFT JOIN wisdomintech.project_members pm ON pm.project_id = p.id AND pm.user_id = $1
         WHERE p.id = $2`,
        [me.id, projectId],
      );

      if (!perm.length) return error(res, "Project not found", 404);
      if (
        perm[0].author_id !== me.id &&
        !["owner", "editor"].includes(perm[0].role) &&
        me.role !== "admin"
      ) {
        return error(res, "Forbidden", 403);
      }

      // Clean repo URL and extract provider & full name
      if (!/^https?:\/\//i.test(repoUrl)) repoUrl = "https://" + repoUrl;
      const isGitHub = /github\.com/i.test(repoUrl);
      const isGitLab = /gitlab\.com/i.test(repoUrl);
      const provider = isGitLab ? "gitlab" : "github";

      // Parse full name e.g. "owner/repo"
      const pathParts = new URL(repoUrl).pathname.replace(/^\/+|\/+$/g, "").split("/");
      const repoFullName =
        pathParts.length >= 2 ? `${pathParts[0]}/${pathParts[1]}` : pathParts[0] || "repository";

      let syncMetadata = {};
      let defaultBranch = body.defaultBranch || "main";

      // Attempt non-blocking fetch of public GitHub repository metadata
      if (isGitHub && pathParts.length >= 2) {
        try {
          const ghRes = await fetch(
            `https://api.github.com/repos/${pathParts[0]}/${pathParts[1]}`,
            {
              headers: {
                "User-Agent": "WisdomInTech-Project-Hub",
                Accept: "application/vnd.github.v3+json",
              },
            },
          );
          if (ghRes.ok) {
            const data = await ghRes.json();
            defaultBranch = data.default_branch || defaultBranch;
            syncMetadata = {
              stars: data.stargazers_count,
              forks: data.forks_count,
              openIssues: data.open_issues_count,
              description: data.description,
              topics: data.topics || [],
              language: data.language,
              license: data.license?.spdx_id,
              lastPush: data.pushed_at,
            };
          }
        } catch {
          // Gracefully fallback to empty metadata if offline or rate limited
        }
      }

      const insertSql = `
        INSERT INTO wisdomintech.project_repositories (
          project_id, provider, repo_url, repo_full_name, default_branch,
          last_synced_at, sync_metadata
        ) VALUES ($1, $2, $3, $4, $5, now(), $6::jsonb)
        ON CONFLICT (project_id, repo_url) DO UPDATE
          SET repo_full_name = EXCLUDED.repo_full_name,
              default_branch = EXCLUDED.default_branch,
              last_synced_at = now(),
              sync_metadata = EXCLUDED.sync_metadata
        RETURNING id, project_id, provider, repo_url, repo_full_name, default_branch, last_synced_at, sync_metadata
      `;
      const { rows: inserted } = await query(insertSql, [
        projectId,
        provider,
        repoUrl,
        repoFullName,
        defaultBranch,
        JSON.stringify(syncMetadata),
      ]);

      return json(res, { success: true, repo: inserted[0] }, 201);
    }

    // DELETE /api/workspace/repos?id=...: Unlink repo
    if (req.method === "DELETE") {
      const repoId = url.searchParams.get("id");
      if (!repoId) return error(res, "Missing repo ID", 400);

      await query(
        `DELETE FROM wisdomintech.project_repositories WHERE id = $1`,
        [repoId],
      );
      return json(res, { success: true, id: repoId });
    }

    return error(res, "Method not allowed", 405);
  } catch (err) {
    return error(res, "Failed to manage repository", 500, {
      detail: err.message,
    });
  }
};
