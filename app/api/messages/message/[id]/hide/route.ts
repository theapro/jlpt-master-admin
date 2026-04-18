import { NextResponse } from "next/server";

import { backendFetch, getAdminTokenFromCookies } from "@/lib/server-backend";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = await getAdminTokenFromCookies();
  if (!token)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const res = await backendFetch(
    `/api/messages/item/${encodeURIComponent(id)}/hide`,
    {
      method: "POST",
      token,
    },
  );
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
