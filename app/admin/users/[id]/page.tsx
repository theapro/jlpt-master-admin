import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { backendJson } from "@/lib/server-backend";

type AdminUser = {
  id: number;
  telegramId: string;
  name: string;
  phone: string | null;
  telegramUsername: string | null;
  telegramNickname: string | null;
  currentStep: string;
  goal: string | null;
  experience: string | null;
  learningFormat: string | null;
  isInSupport: boolean;
  supportStatus: string;
  createdAt: string;
};

type ChatHistoryResponse = {
  telegramId: string;
  messages: Array<{ createdAt: string }>;
};

const formatDateTime = (iso: string | null | undefined) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "—";
  return d.toLocaleString();
};

const formatUsername = (value: string | null | undefined) => {
  const u = typeof value === "string" ? value.trim() : "";
  if (!u) return "—";
  return `@${u.replace(/^@+/, "")}`;
};

const formatSupportStatus = (value: string | null | undefined) => {
  const v = typeof value === "string" ? value : "none";
  if (v === "active") return "IN_PROGRESS";
  if (v === "closed") return "CLOSED";
  if (v === "pending") return "OPEN";
  return v.toUpperCase();
};

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let user: AdminUser;
  try {
    const data = await backendJson<{ user: AdminUser }>(`/api/users/${id}`);
    user = data.user;
  } catch (err) {
    return (
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <h2 className="text-2xl font-semibold tracking-tight">User</h2>
          <p className="text-sm text-destructive">
            {err instanceof Error ? err.message : "Failed to load user"}
          </p>
        </div>
      </div>
    );
  }

  let lastActivity: string | null = null;
  try {
    const history = await backendJson<ChatHistoryResponse>(
      `/api/messages/${encodeURIComponent(user.telegramId)}?limit=1&markRead=false`,
    );
    const last = Array.isArray(history.messages) ? history.messages[0] : null;
    lastActivity = last?.createdAt ?? null;
  } catch {
    lastActivity = null;
  }

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="flex items-center justify-between gap-4 px-4 lg:px-6">
        <div className="min-w-0">
          <h2 className="truncate text-2xl font-semibold tracking-tight">
            {user.name}
          </h2>
          <p className="text-sm text-muted-foreground">User #{user.id}</p>
        </div>
        <Link
          href="/admin/users"
          className={buttonVariants({ variant: "outline" })}
        >
          Back
        </Link>
      </div>

      <div className="px-4 lg:px-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-1">
                <div className="text-sm text-muted-foreground">Name</div>
                <div className="text-sm">{user.name}</div>
              </div>

              <div className="grid gap-1">
                <div className="text-sm text-muted-foreground">Username</div>
                <div className="text-sm">
                  {formatUsername(user.telegramUsername)}
                </div>
              </div>

              <div className="grid gap-1">
                <div className="text-sm text-muted-foreground">Phone</div>
                <div className="text-sm">{user.phone ?? "—"}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Learning Info</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-1">
                <div className="text-sm text-muted-foreground">
                  Selected goal
                </div>
                <div className="text-sm">{user.goal ?? "—"}</div>
              </div>

              <div className="grid gap-1">
                <div className="text-sm text-muted-foreground">
                  Selected format
                </div>
                <div className="text-sm">{user.learningFormat ?? "—"}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Activity</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-1">
                <div className="text-sm text-muted-foreground">Created at</div>
                <div className="text-sm">{formatDateTime(user.createdAt)}</div>
              </div>

              <div className="grid gap-1">
                <div className="text-sm text-muted-foreground">
                  Last activity
                </div>
                <div className="text-sm">{formatDateTime(lastActivity)}</div>
              </div>

              <div className="grid gap-1">
                <div className="text-sm text-muted-foreground">
                  Support status
                </div>
                <div className="text-sm">
                  <Badge
                    variant={
                      user.supportStatus === "active" ||
                      user.supportStatus === "pending"
                        ? "default"
                        : "outline"
                    }
                  >
                    {formatSupportStatus(user.supportStatus)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
