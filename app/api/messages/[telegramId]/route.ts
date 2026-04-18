import { NextRequest, NextResponse } from "next/server";

import { backendFetch, getAdminTokenFromCookies } from "@/lib/server-backend";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ telegramId: string }> },
) {
  const token = await getAdminTokenFromCookies();
  if (!token)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { telegramId } = await params;
  const search = req.nextUrl.search;
  const res = await backendFetch(
    `/api/messages/${encodeURIComponent(telegramId)}${search}`,
    { token },
  );
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
