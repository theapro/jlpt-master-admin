import { NextRequest, NextResponse } from "next/server";

import { backendFetch, getAdminTokenFromCookies } from "@/lib/server-backend";

export async function GET(req: NextRequest) {
  const token = await getAdminTokenFromCookies();
  if (!token)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const search = req.nextUrl.search;
  const res = await backendFetch(`/api/messages/users${search}`, { token });

  // Backward compatibility: older backends may only expose /api/messages/chats.
  if (res.status === 404) {
    const fallback = await backendFetch("/api/messages/chats", { token });
    const fallbackData = await fallback.json().catch(() => ({}));

    if (fallback.ok) {
      const chats =
        fallbackData &&
        typeof fallbackData === "object" &&
        Array.isArray((fallbackData as { chats?: unknown }).chats)
          ? ((fallbackData as { chats: unknown[] }).chats ?? [])
          : [];

      const limitRaw = Number.parseInt(
        req.nextUrl.searchParams.get("limit") ?? "25",
        10,
      );
      const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : 25;

      return NextResponse.json(
        {
          chats,
          page: 1,
          limit,
          hasMore: false,
        },
        { status: 200 },
      );
    }

    return NextResponse.json(fallbackData, { status: fallback.status });
  }

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
