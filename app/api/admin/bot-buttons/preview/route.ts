import { NextRequest, NextResponse } from "next/server";

import { backendFetch, getAdminTokenFromCookies } from "@/lib/server-backend";

export async function GET(req: NextRequest) {
  const token = await getAdminTokenFromCookies();
  if (!token)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const state = url.searchParams.get("state");

  const path = state
    ? `/api/admin/bot-buttons/preview?state=${encodeURIComponent(state)}`
    : "/api/admin/bot-buttons/preview";

  const res = await backendFetch(path, {
    method: "GET",
    token,
  });

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
