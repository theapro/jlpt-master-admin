import "server-only";

import { cookies } from "next/headers";

import { ADMIN_TOKEN_COOKIE, getBackendUrl } from "@/lib/backend";

type BackendJsonInit = Omit<RequestInit, "body"> & {
  body?: unknown;
  token?: string | null;
};

export function getAdminTokenFromCookies() {
  return cookies().then(
    (cookieStore) => cookieStore.get(ADMIN_TOKEN_COOKIE)?.value ?? null,
  );
}

export async function backendFetch(path: string, init: BackendJsonInit = {}) {
  const url = `${getBackendUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  const token = init.token ?? (await getAdminTokenFromCookies());

  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const hasBody = init.body !== undefined;
  if (hasBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(url, {
    ...init,
    headers,
    body: hasBody ? JSON.stringify(init.body) : undefined,
    cache: init.cache ?? "no-store",
  });
}

export async function backendJson<T>(path: string, init: BackendJsonInit = {}) {
  const res = await backendFetch(path, init);
  if (res.ok) return (await res.json()) as T;

  let message = `Backend request failed (${res.status})`;
  try {
    const data = (await res.json()) as unknown;
    const messageValue =
      data && typeof data === "object"
        ? (data as { message?: unknown }).message
        : undefined;
    if (typeof messageValue === "string") message = messageValue;
  } catch {
    // ignore
  }

  throw new Error(message);
}
