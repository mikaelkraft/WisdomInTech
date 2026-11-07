import { api } from "./api/client";

export const apiKeyService = {
  // Fetch user's active API keys
  async getKeys() {
    try {
      const data = await api.get("/keys");
      return { success: true, data: Array.isArray(data) ? data : [] };
    } catch (err) {
      console.warn("Failed to fetch API keys:", err);
      return { success: false, error: err.message || "Failed to load API keys", data: [] };
    }
  },

  // Create a new API key
  async createKey(name = "External Projects Key", scopes = ["projects:read"]) {
    try {
      const data = await api.post("/keys", { name, scopes });
      return { success: true, data };
    } catch (err) {
      console.error("Failed to generate API key:", err);
      return { success: false, error: err.message || "Failed to generate API key" };
    }
  },

  // Revoke an API key
  async revokeKey(id) {
    try {
      const data = await api.delete("/keys", { id });
      return { success: true, data };
    } catch (err) {
      console.error("Failed to revoke API key:", err);
      return { success: false, error: err.message || "Failed to revoke API key" };
    }
  },
};

export default apiKeyService;
