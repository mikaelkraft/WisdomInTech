import supabase from "./supabase";

export const getAdminEmails = () => {
  const envAdmins =
    (typeof import.meta !== "undefined" &&
      import.meta.env &&
      (import.meta.env.VITE_ADMIN_EMAIL || import.meta.env.ADMIN_EMAIL)) ||
    "";
  if (!envAdmins) return [];
  return envAdmins
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
};

export const ADMIN_EMAIL = getAdminEmails()[0] || "";

export const isAdminEmail = (email) => {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return getAdminEmails().includes(normalized);
};

class AuthService {
  // Detect local/dev environment (Vite)
  isDevEnv() {
    try {
      const viteDev =
        typeof import.meta !== "undefined" &&
        import.meta &&
        import.meta.env &&
        !!import.meta.env.DEV;
      const isLocalhost =
        typeof window !== "undefined" &&
        ["localhost", "127.0.0.1"].includes(window.location.hostname);
      return !!(viteDev || isLocalhost);
    } catch {
      return false;
    }
  }

  // Sign in with email and password via Supabase Auth
  async signIn(email, password) {
    try {
      if (!email || !password) {
        return { success: false, error: "Please provide both email and password." };
      }
      const normalizedEmail = email.trim().toLowerCase();

      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // Check admin rights sensed from env and synchronize with Neon
      const isConfiguredAdmin = isAdminEmail(data?.user?.email || normalizedEmail);
      const role = isConfiguredAdmin ? "admin" : "member";

      try {
        if (data?.user?.id) {
          await this.ensureUserProfile(data.user.id, normalizedEmail, role);
        }
      } catch (err) {
        console.warn("Could not ensure profile:", err);
      }

      return {
        success: true,
        data: {
          ...data,
          isAdmin: isConfiguredAdmin,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error?.message || "An unexpected error occurred during sign in",
      };
    }
  }

  // Sign in with OAuth (Google, GitHub, X, Discord, LinkedIn, GitLab)
  async signInWithOAuth(provider) {
    try {
      if (!supabase || !supabase.auth || typeof supabase.auth.signInWithOAuth !== "function") {
        return {
          success: false,
          error: `OAuth client is not initialized for ${provider}. Please verify VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env and restart the dev server.`,
        };
      }

      // Preserve redirect target
      const redirectPath =
        window.location.pathname.startsWith("/admin")
          ? "/admin"
          : "/workspace";

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}${redirectPath}`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error?.message || "An unexpected error occurred during OAuth sign in",
      };
    }
  }

  // Sign up new user (collaborator, viewer, publisher, team member)
  async signUp(email, password, userData = {}) {
    try {
      if (!email || !password) {
        return { success: false, error: "Please provide both email and password." };
      }
      const normalizedEmail = email.trim().toLowerCase();
      const isConfiguredAdmin = isAdminEmail(normalizedEmail);

      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            full_name: userData.full_name || normalizedEmail.split("@")[0],
            ...userData,
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data?.user?.id) {
        await this.ensureUserProfile(
          data.user.id,
          normalizedEmail,
          isConfiguredAdmin ? "admin" : "member",
          userData.full_name || normalizedEmail.split("@")[0]
        );
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error?.message || "An unexpected error occurred during sign up",
      };
    }
  }

  // Sign out
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error?.message || "An unexpected error occurred during sign out",
      };
    }
  }

  // Request email OTP or passwordless magic link
  async requestOtp(email) {
    try {
      if (!email) {
        return { success: false, error: "Please enter a valid email address." };
      }
      const normalizedEmail = email.trim().toLowerCase();

      const { data, error } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/admin`,
          shouldCreateUser: true,
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error?.message || "Failed to send verification code." };
    }
  }

  // Verify email OTP code
  async verifyOtp(email, token) {
    try {
      if (!email || !token) {
        return { success: false, error: "Email and verification code are required." };
      }
      const normalizedEmail = email.trim().toLowerCase();

      const { data, error } = await supabase.auth.verifyOtp({
        email: normalizedEmail,
        token: token.trim(),
        type: "email",
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data?.user?.id) {
        const role = isAdminEmail(normalizedEmail) ? "admin" : "member";
        await this.ensureUserProfile(data.user.id, normalizedEmail, role);
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error?.message || "Invalid or expired verification code." };
    }
  }

  // Ensure profile exists with the correct role (upserting into user_profiles)
  async ensureUserProfile(userId, email, role = "member", fullName) {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const sensedRole = isAdminEmail(normalizedEmail) ? "admin" : role;

      const { data, error } = await supabase
        .from("user_profiles")
        .upsert(
          {
            id: userId,
            email: normalizedEmail,
            full_name: fullName || normalizedEmail.split("@")[0],
            role: sensedRole,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        )
        .select("id, role, email")
        .single();

      if (error) {
        console.warn("ensureUserProfile warning:", error.message);
      }
      return { success: true, data };
    } catch (e) {
      console.warn("ensureUserProfile error:", e);
      return { success: false };
    }
  }

  // Get current session
  async getSession() {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error?.message || "Failed to get session" };
    }
  }

  // Get user profile
  async getUserProfile(userId) {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        // Synthesize profile from auth session if table row is absent
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user && user.id === userId) {
          const role = isAdminEmail(user.email) ? "admin" : "member";
          return {
            success: true,
            data: {
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name || user.email?.split("@")[0],
              role,
            },
          };
        }
        return { success: false, error: error.message };
      }

      // Dynamic override: If user email matches admin config, enforce admin role
      if (isAdminEmail(data?.email) && data.role !== "admin") {
        data.role = "admin";
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error?.message || "Failed to load user profile" };
    }
  }

  // Update user profile
  async updateUserProfile(userId, updates) {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error?.message || "Failed to update profile" };
    }
  }

  // Reset password
  async resetPassword(email) {
    try {
      const normalizedEmail = (email || "").trim().toLowerCase();
      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error?.message || "Failed to send reset email" };
    }
  }

  // Listen for auth state changes
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
  }

  // Check if current user is admin
  async isAdmin() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return false;
      }

      if (isAdminEmail(user.email)) {
        return true;
      }

      const { data, error } = await supabase
        .from("user_profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (error || !data) {
        return false;
      }

      return data.role === "admin";
    } catch {
      return false;
    }
  }
}

const authService = new AuthService();
export default authService;
