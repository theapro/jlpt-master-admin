"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ADMIN_TOKEN_COOKIE, getBackendUrl } from "@/lib/backend";

const SAFE_PREFIXES = [
  "/dashboard",
  "/users",
  "/admins",
  "/courses",
  "/messages",
  "/goals",
  "/bot-buttons",
  "/admin",
] as const;

const isSafeNextPath = (value: string) => {
  if (!value.startsWith("/")) return false;
  if (value.startsWith("//")) return false;

  const path = value.split("?")[0] ?? value;
  return SAFE_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
};

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/dashboard");

  const res = await fetch(`${getBackendUrl()}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    cache: "no-store",
  });

  if (!res.ok) {
    const url = new URL("/login", "http://local");
    url.searchParams.set("error", "Invalid email or password");
    if (next) url.searchParams.set("next", next);
    redirect(url.pathname + url.search);
  }

  const data = (await res.json()) as { token?: string };
  const token = typeof data.token === "string" ? data.token : null;

  if (!token) {
    const url = new URL("/login", "http://local");
    url.searchParams.set("error", "Login failed");
    if (next) url.searchParams.set("next", next);
    redirect(url.pathname + url.search);
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_TOKEN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  redirect(isSafeNextPath(next) ? next : "/dashboard");
}
