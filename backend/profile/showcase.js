const { json, error, getUrl } = require("../_lib/respond.js");
const { query } = require("../_lib/db.js");

module.exports = async function handler(req, res) {
  // Public showcase endpoint - enable CORS for external embeds / profiles
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    return res.end();
  }

  if (req.method !== "GET") {
    return error(res, "Method not allowed", 405);
  }

  try {
    const url = getUrl(req);
    const username = (url.searchParams.get("username") || "")
      .trim()
      .toLowerCase()
      .replace(/^@+/, "");

    if (!username) {
      return error(res, "Missing username query parameter", 400);
    }

    // Lookup user profile by username
    const profileSql = `
      SELECT id, email, full_name, username, avatar_url, role, bio, headline, skills,
             theme_preference, website_url, twitter_handle, github_handle, linkedin_handle,
             location, created_at
      FROM wisdomintech.user_profiles
      WHERE LOWER(username) = LOWER($1) AND (banned IS NOT TRUE)
      LIMIT 1
    `;
    const { rows: profileRows } = await query(profileSql, [username]);

    if (!profileRows.length) {
      return error(res, `User '@${username}' not found`, 404);
    }

    const rawUser = profileRows[0];
    const user = {
      id: rawUser.id,
      fullName: rawUser.full_name || rawUser.username,
      username: rawUser.username,
      avatarUrl: rawUser.avatar_url,
      role: rawUser.role,
      bio: rawUser.bio,
      headline: rawUser.headline,
      skills: Array.isArray(rawUser.skills) ? rawUser.skills : [],
      themePreference: rawUser.theme_preference || "cyberpunk",
      websiteUrl: rawUser.website_url,
      twitterHandle: rawUser.twitter_handle,
      githubHandle: rawUser.github_handle,
      linkedinHandle: rawUser.linkedin_handle,
      location: rawUser.location,
      joinedAt: rawUser.created_at,
    };

    // Query published projects authored by this user
    const projectsSql = `
      SELECT p.id, p.title, p.description, p.featured_image, p.gallery_images,
             p.type, p.video_url, p.video_poster, p.tags, p.category, p.featured,
             p.view_count, p.like_count, p.created_at, p.updated_at
      FROM wisdomintech.projects p
      WHERE p.author_id = $1
        AND p.status = 'published'
        AND (p.deleted_at IS NULL)
      ORDER BY p.featured DESC, p.created_at DESC
    `;
    const { rows: projectRows } = await query(projectsSql, [user.id]);

    // Format projects
    const projects = projectRows.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      featuredImage: p.featured_image,
      galleryImages: p.gallery_images || [],
      type: p.type || "image",
      videoUrl: p.video_url,
      tags: p.tags || [],
      category: p.category || "General",
      featured: Boolean(p.featured),
      views: p.view_count || 0,
      likes: p.like_count || 0,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    }));

    // Calculate aggregated showcase metrics
    const stats = {
      totalProjects: projects.length,
      totalViews: projects.reduce((acc, curr) => acc + (curr.views || 0), 0),
      totalLikes: projects.reduce((acc, curr) => acc + (curr.likes || 0), 0),
      topCategories: [...new Set(projects.map((p) => p.category).filter(Boolean))],
    };

    return json(res, {
      user,
      stats,
      projects,
    });
  } catch (err) {
    return error(res, "Failed to load showcase", 500, { detail: err.message });
  }
};
