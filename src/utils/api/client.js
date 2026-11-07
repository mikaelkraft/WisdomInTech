import supabase from "../supabase";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

async function getAuthHeader() {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
    const devToken =
      typeof import.meta !== "undefined" &&
      import.meta.env &&
      import.meta.env.VITE_DEV_ADMIN_TOKEN;
    if (
      devToken &&
      typeof window !== "undefined" &&
      window.localStorage.getItem("dev_admin") === "true"
    ) {
      return { Authorization: `Bearer ${devToken}` };
    }
  } catch {}
  return {};
}

async function handle(res) {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  async get(path, params, customHeaders = {}) {
    const url = new URL(
      (API_BASE + path).replace(/\/$/, ""),
      window.location.origin,
    );
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
      });
    }
    const authHeaders = await getAuthHeader();
    return handle(
      await fetch(url.toString(), {
        headers: {
          accept: "application/json",
          ...authHeaders,
          ...customHeaders,
        },
      }),
    );
  },

  async post(path, body, customHeaders = {}) {
    const url = new URL(
      (API_BASE + path).replace(/\/$/, ""),
      window.location.origin,
    );
    const authHeaders = await getAuthHeader();
    return handle(
      await fetch(url.toString(), {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json",
          ...authHeaders,
          ...customHeaders,
        },
        body: JSON.stringify(body),
      }),
    );
  },

  async put(path, body, customHeaders = {}) {
    const url = new URL(
      (API_BASE + path).replace(/\/$/, ""),
      window.location.origin,
    );
    const authHeaders = await getAuthHeader();
    return handle(
      await fetch(url.toString(), {
        method: "PUT",
        headers: {
          "content-type": "application/json",
          accept: "application/json",
          ...authHeaders,
          ...customHeaders,
        },
        body: JSON.stringify(body),
      }),
    );
  },

  async delete(path, params, customHeaders = {}) {
    const url = new URL(
      (API_BASE + path).replace(/\/$/, ""),
      window.location.origin,
    );
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
      });
    }
    const authHeaders = await getAuthHeader();
    return handle(
      await fetch(url.toString(), {
        method: "DELETE",
        headers: {
          accept: "application/json",
          ...authHeaders,
          ...customHeaders,
        },
      }),
    );
  },
};
