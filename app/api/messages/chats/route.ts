import { NextResponse } from "next/server";

import { backendFetch, getAdminTokenFromCookies } from "@/lib/server-backend";

export async function GET() {
  const token = await getAdminTokenFromCookies();
  if (!token)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const res = await backendFetch("/api/messages/chats", { token });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
