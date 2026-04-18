"use server";

import { redirect } from "next/navigation";

import { getBackendUrl } from "@/lib/backend";

export async function resetPasswordAction(formData: FormData) {
  const token = String(formData.get("token") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  const url = new URL("/reset-password", "http://local");
  if (token) url.searchParams.set("token", token);

  if (!token) {
    url.searchParams.set("error", "missingResetToken");
    redirect(url.pathname + url.search);
  }

  if (password !== confirmPassword) {
    url.searchParams.set("error", "passwordsDoNotMatch");
    redirect(url.pathname + url.search);
  }

  const res = await fetch(
    `${getBackendUrl()}/api/admin/password-reset/confirm`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword: password }),
      cache: "no-store",
    },
  );

  if (!res.ok) {
    url.searchParams.set("error", "resetFailed");
    redirect(url.pathname + url.search);
  }

  const loginUrl = new URL("/login", "http://local");
  loginUrl.searchParams.set("success", "1");
  redirect(loginUrl.pathname + loginUrl.search);
}
