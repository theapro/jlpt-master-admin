import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getServerT } from "@/lib/i18n/server";
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

const formatDateTime = (iso: string | null | undefined, locale: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "—";
  return d.toLocaleString(locale);
};

const formatUsername = (value: string | null | undefined) => {
  const u = typeof value === "string" ? value.trim() : "";
  if (!u) return "—";
  return `@${u.replace(/^@+/, "")}`;
};

const formatSupportStatus = (
  value: string | null | undefined,
  t: (key: string) => string,
) => {
  const v = typeof value === "string" ? value : "none";
  if (v === "active") return t("supportStatus.active");
  if (v === "closed") return t("supportStatus.closed");
  if (v === "pending") return t("supportStatus.pending");
  if (v === "none") return t("supportStatus.none");
  return t("supportStatus.unknown");
};

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { t, locale } = await getServerT();
  const { id } = await params;

  let user: AdminUser;
  try {
    const data = await backendJson<{ user: AdminUser }>(`/api/users/${id}`);
    user = data.user;
  } catch {
    return (
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t("common.user")}
          </h2>
          <p className="text-sm text-destructive">
            {t("users.failedToLoadUser")}
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
          <p className="text-sm text-muted-foreground">
            {t("common.user")} #{user.id}
          </p>
        </div>
        <Link
          href="/admin/users"
          className={buttonVariants({ variant: "outline" })}
        >
          {t("common.back")}
        </Link>
      </div>

      <div className="px-4 lg:px-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>{t("common.profile")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-1">
                <div className="text-sm text-muted-foreground">
                  {t("common.name")}
                </div>
                <div className="text-sm">{user.name}</div>
              </div>

              <div className="grid gap-1">
                <div className="text-sm text-muted-foreground">
                  {t("common.username")}
                </div>
                <div className="text-sm">
                  {formatUsername(user.telegramUsername)}
                </div>
              </div>

              <div className="grid gap-1">
                <div className="text-sm text-muted-foreground">
                  {t("common.phone")}
                </div>
                <div className="text-sm">{user.phone ?? "—"}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("common.learningInfo")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-1">
                <div className="text-sm text-muted-foreground">
                  {t("common.selectedGoal")}
                </div>
                <div className="text-sm">{user.goal ?? "—"}</div>
              </div>

              <div className="grid gap-1">
                <div className="text-sm text-muted-foreground">
                  {t("common.selectedFormat")}
                </div>
                <div className="text-sm">{user.learningFormat ?? "—"}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("common.activity")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-1">
                <div className="text-sm text-muted-foreground">
                  {t("common.createdAt")}
                </div>
                <div className="text-sm">
                  {formatDateTime(user.createdAt, locale)}
                </div>
              </div>

              <div className="grid gap-1">
                <div className="text-sm text-muted-foreground">
                  {t("common.lastActivity")}
                </div>
                <div className="text-sm">
                  {formatDateTime(lastActivity, locale)}
                </div>
              </div>

              <div className="grid gap-1">
                <div className="text-sm text-muted-foreground">
                  {t("common.supportStatus")}
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
                    {formatSupportStatus(user.supportStatus, t)}
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
