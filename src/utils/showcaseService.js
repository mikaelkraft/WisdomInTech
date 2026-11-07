import { api } from "./api/client";

export const showcaseService = {
  // Public showcase data by username
  async getShowcase(username) {
    try {
      const cleanUsername = String(username || "").replace(/^@+/, "").trim();
      const data = await api.get(`/profile/showcase?username=${encodeURIComponent(cleanUsername)}`);
      return { success: true, data };
    } catch (err) {
      return {
        success: false,
        error: err.message || "Failed to load creator showcase",
        data: null,
      };
    }
  },

  // Authenticated user profile
  async getMyProfile() {
    try {
      const data = await api.get("/profile");
      return { success: true, profile: data.profile || data };
    } catch (err) {
      return { success: false, error: err.message || "Failed to load profile" };
    }
  },

  // Update authenticated user profile
  async updateMyProfile(profileData) {
    try {
      const data = await api.put("/profile", profileData);
      return { success: true, profile: data };
    } catch (err) {
      return { success: false, error: err.message || "Failed to update profile" };
    }
  },
};

export default showcaseService;
