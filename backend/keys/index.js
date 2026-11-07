const nodeCrypto = require("crypto");
const { json, error, getUrl } = require("../_lib/respond.js");
const { query } = require("../_lib/db.js");
const { getUserWithRole } = require("../_lib/auth.js");
const { getJsonBody } = require("../_lib/body.js");

module.exports = async function handler(req, res) {
  try {
    const user = await getUserWithRole(req);
    if (!user) {
      return error(res, "Authentication required to manage API keys", 401);
    }

    if (req.method === "GET") {
      const { rows } = await query(
        `SELECT id, name, key_prefix, scopes, rate_limit_per_minute, is_active, last_used_at, created_at
         FROM wisdomintech.api_keys
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [user.id],
      );
      return json(res, rows);
    }

    if (req.method === "POST") {
      const body = await getJsonBody(req);
      const name = (body?.name || "").trim() || "External Projects Key";
      const scopes =
        Array.isArray(body?.scopes) && body.scopes.length
          ? body.scopes
          : ["projects:read"];

      // Generate random secure 48-char hex secret
      const randomHex = nodeCrypto.randomBytes(24).toString("hex");
      const rawKey = `mk_live_${randomHex}`;
      const keyPrefix = `mk_live_${randomHex.slice(0, 6)}...${randomHex.slice(-4)}`;
      const keyHash = nodeCrypto.createHash("sha256").update(rawKey).digest("hex");

      const { rows } = await query(
        `INSERT INTO wisdomintech.api_keys (user_id, name, key_prefix, key_hash, scopes)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, name, key_prefix, scopes, is_active, created_at`,
        [user.id, name, keyPrefix, keyHash, scopes],
      );

      return json(
        res,
        {
          ...rows[0],
          apiKey: rawKey,
          message:
            "Please copy this key now. For security, it will not be displayed again.",
        },
        201,
      );
    }

    if (req.method === "DELETE") {
      const url = getUrl(req);
      const id = url.searchParams.get("id");
      if (!id) {
        return error(res, "Missing key ID parameter", 400);
      }

      const { rowCount } = await query(
        `DELETE FROM wisdomintech.api_keys WHERE id = $1 AND (user_id = $2 OR $3 = 'admin')`,
        [id, user.id, user.role],
      );

      if (!rowCount) {
        return error(res, "API key not found or unauthorized", 404);
      }

      return json(res, { success: true, id, message: "API key revoked" });
    }

    return error(res, "Method not allowed", 405);
  } catch (err) {
    console.error("API keys error:", err);
    return error(res, err.message || "Failed to process API key request", 500);
  }
};
