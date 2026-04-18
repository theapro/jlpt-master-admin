import { NextRequest, NextResponse } from "next/server";

import { backendFetch, getAdminTokenFromCookies } from "@/lib/server-backend";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = await getAdminTokenFromCookies();
  if (!token)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);

  const res = await backendFetch(
    `/api/admin/bot-buttons/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      token,
      body,
    },
  );

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = await getAdminTokenFromCookies();
  if (!token)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const res = await backendFetch(
    `/api/admin/bot-buttons/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
      token,
    },
  );

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
