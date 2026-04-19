"use server";

import { redirect } from "next/navigation";

import { getBackendUrl } from "@/lib/backend";

export async function requestPasswordResetAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();

  const res = await fetch(
    `${getBackendUrl()}/api/admin/password-reset/request`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
      cache: "no-store",
    },
  );

  const url = new URL("/forgot-password", "http://local");
  if (email) url.searchParams.set("email", email);

  if (!res.ok) {
    url.searchParams.set("error", "sendResetFailed");
    redirect(url.pathname + url.search);
  }

  url.searchParams.set("sent", "1");
  redirect(url.pathname + url.search);
}
