const nodeCrypto = require("crypto");
const { json, error, getUrl } = require("../_lib/respond.js");
const { query } = require("../_lib/db.js");

module.exports = async function handler(req, res) {
  // Global CORS headers for cross-origin third-party embeds
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, x-api-key, X-Api-Key",
  );

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== "GET") {
    return error(res, "Method not allowed. Use GET to fetch projects.", 405);
  }

  try {
    const url = getUrl(req);

    // Extract API key from x-api-key header, Authorization Bearer, or query string
    const authHeader =
      req.headers["authorization"] || req.headers["Authorization"];
    const xApiKey = req.headers["x-api-key"] || req.headers["X-Api-Key"];
    const queryApiKey = url.searchParams.get("apiKey");

    let rawKey = null;
    if (xApiKey) {
      rawKey = String(xApiKey).trim();
    } else if (authHeader && authHeader.startsWith("Bearer ")) {
      rawKey = authHeader.slice(7).trim();
    } else if (queryApiKey) {
      rawKey = String(queryApiKey).trim();
    }

    if (!rawKey) {
      return error(
        res,
        "API key required. Supply via 'x-api-key' header, 'Authorization: Bearer <key>', or '?apiKey=' query param.",
        401,
      );
    }

    // Verify key hash
    const keyHash = nodeCrypto.createHash("sha256").update(rawKey).digest("hex");
    const { rows: keyRows } = await query(
      `SELECT ak.id, ak.user_id, ak.scopes, ak.is_active, u.full_name, u.email, u.role
       FROM wisdomintech.api_keys ak
       JOIN wisdomintech.user_profiles u ON u.id = ak.user_id
       WHERE ak.key_hash = $1 AND ak.is_active = true`,
      [keyHash],
    );

    if (!keyRows.length) {
      return error(res, "Invalid, revoked, or inactive API key.", 401);
    }

    const key = keyRows[0];

    // Check scope
    const scopes = key.scopes || [];
    if (!scopes.includes("projects:read") && !scopes.includes("*")) {
      return error(res, "API key lacks 'projects:read' scope permission.", 403);
    }

    // Update last_used_at timestamp asynchronously
    query(
      "UPDATE wisdomintech.api_keys SET last_used_at = now() WHERE id = $1",
      [key.id],
    ).catch(() => {});

    // Filters
    const category = url.searchParams.get("category");
    const tag = url.searchParams.get("tag");
    const featured = url.searchParams.get("featured");
    const search = url.searchParams.get("search");
    const limit = Math.min(
      Math.max(Number(url.searchParams.get("limit") || 50), 1),
      100,
    );
    const offset = Math.max(Number(url.searchParams.get("offset") || 0), 0);

    const conditions = ["p.deleted_at IS NULL", "p.status = 'published'"];
    const params = [];

    // Filter by project author (unless admin requests all=true)
    const canQueryAll =
      key.role === "admin" && url.searchParams.get("all") === "true";
    if (!canQueryAll) {
      params.push(key.user_id);
      conditions.push(`p.author_id = $${params.length}`);
    }

    if (category) {
      params.push(category.trim());
      conditions.push(`p.category = $${params.length}`);
    }

    if (tag) {
      params.push(tag.trim().toLowerCase());
      conditions.push(`$${params.length} = ANY(p.tags)`);
    }

    if (featured === "true") {
      conditions.push("p.featured = true");
    }

    if (search) {
      params.push(`%${search.trim()}%`);
      conditions.push(
        `(p.title ILIKE $${params.length} OR p.description ILIKE $${params.length})`,
      );
    }

    const whereClause = conditions.join(" AND ");

    // Get total count
    const countSql = `SELECT COUNT(1)::int as total FROM wisdomintech.projects p WHERE ${whereClause}`;
    const { rows: countRows } = await query(countSql, params);
    const total = countRows[0]?.total || 0;

    // Fetch projects
    params.push(limit);
    const limitParam = `$${params.length}`;
    params.push(offset);
    const offsetParam = `$${params.length}`;

    const projectsSql = `
      SELECT p.id, p.title, p.description, p.featured_image, p.gallery_images,
             p.type, p.video_url, p.video_poster, p.tags, p.category, p.status,
             p.featured, p.view_count, p.like_count, p.created_at, p.updated_at
      FROM wisdomintech.projects p
      WHERE ${whereClause}
      ORDER BY p.featured DESC NULLS LAST, p.created_at DESC
      LIMIT ${limitParam} OFFSET ${offsetParam}
    `;

    const { rows: projectRows } = await query(projectsSql, params);

    return json(res, {
      success: true,
      owner: {
        name: key.full_name,
        email: key.email,
      },
      pagination: {
        total,
        count: projectRows.length,
        limit,
        offset,
      },
      projects: projectRows,
    });
  } catch (err) {
    console.error("External Projects API error:", err);
    return error(
      res,
      err.message || "Failed to process external projects request",
      500,
    );
  }
};
