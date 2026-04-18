export const ADMIN_TOKEN_COOKIE = "admin_token" as const;

export function getBackendUrl() {
  const raw =
    process.env.BACKEND_URL ??
    process.env.API_BASE_URL ??
    process.env.BOT_BACKEND_URL ??
    "";

  if (!raw || raw.trim().length === 0) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("BACKEND_URL is not set");
    }
    return "http://localhost:3000";
  }

  return raw.replace(/\/+$/, "");
}
