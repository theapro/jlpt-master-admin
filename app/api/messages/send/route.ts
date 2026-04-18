import { NextRequest, NextResponse } from "next/server";

import { backendFetch, getAdminTokenFromCookies } from "@/lib/server-backend";

export async function POST(req: NextRequest) {
  const token = await getAdminTokenFromCookies();
  if (!token)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const res = await backendFetch("/api/messages/send", {
    method: "POST",
    token,
    body,
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
