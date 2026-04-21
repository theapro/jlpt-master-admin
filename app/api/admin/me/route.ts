import { NextResponse } from "next/server";

import { backendFetch, getAdminTokenFromCookies } from "@/lib/server-backend";

export async function GET() {
  const token = await getAdminTokenFromCookies();
  if (!token)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const res = await backendFetch("/api/admin/me", {
    method: "GET",
    token,
  });

  // Some backend deployments can return 404 for stale/missing admin records.
  // Normalize it to 401 so the UI treats it as an expired session.
  if (res.status === 404) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
