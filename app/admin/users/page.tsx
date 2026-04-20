import Link from "next/link";
import { redirect } from "next/navigation";

import { ClickableTableRow } from "@/components/admin/clickable-table-row";
import { SupportStatusSelect } from "@/components/admin/support-status-select";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getServerT } from "@/lib/i18n/server";
import { backendJson } from "@/lib/server-backend";

type AdminUser = {
  id: number;
  telegramId: string;
  name: string;
  phone: string | null;
  telegramUsername: string | null;
  telegramNickname: string | null;
  pendingCourseId: number | null;
  goal: string | null;
  experience: "beginner" | "intermediate" | null;
  isInSupport: boolean;
  supportStatus: "none" | "pending" | "active" | "closed";
  supportAdmin: { id: number; name: string } | null;
};

type AdminCourse = {
  id: number;
  title: string;
};

type UserListResponse = {
  users: AdminUser[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
};

const formatUsername = (value: string | null | undefined) => {
  const u = typeof value === "string" ? value.trim() : "";
  if (!u) return "—";
  return `@${u.replace(/^@+/, "")}`;
};

const getQueryValue = (value: string | string[] | undefined) => {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
};

const buildQueryString = (params: Record<string, string | number | null>) => {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed.length > 0) searchParams.set(key, trimmed);
    } else if (typeof value === "number" && Number.isFinite(value)) {
      searchParams.set(key, String(value));
    }
  }
  return searchParams.toString();
};

const resolveCourseLabel = (
  user: AdminUser,
  courseById: Map<number, string>,
  t: (key: string) => string,
) => {
  if (user.experience === "beginner") return t("userExperience.beginner");

  const courseId = user.pendingCourseId;
  if (typeof courseId === "number" && courseId > 0) {
    return courseById.get(courseId) ?? `${t("common.course")} #${courseId}`;
  }

  if (user.experience === "intermediate")
    return t("userExperience.intermediate");
  return "—";
};

async function updateSupportStatusAction(userId: number, formData: FormData) {
  "use server";

  const supportStatus = String(formData.get("supportStatus") ?? "").trim();

  try {
    await backendJson<{ user: { id: number } }>(
      `/api/users/${userId}/support-status`,
      {
        method: "PATCH",
        body: { supportStatus },
      },
    );

    redirect("/admin/users");
  } catch {
    const url = new URL("/admin/users", "http://local");
    url.searchParams.set("error", "supportStatusUpdateFailed");
    redirect(url.pathname + url.search);
  }
}

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<{
    error?: string;
    q?: string;
    supportStatus?: string;
    page?: string;
  }>;
}) {
  const { t } = await getServerT();
  const sp = (await searchParams) ?? {};
  const q = getQueryValue(sp.q);
  const supportStatus = getQueryValue(sp.supportStatus);
  const currentPage = Math.max(
    1,
    Number.parseInt(getQueryValue(sp.page) ?? "1", 10) || 1,
  );
  const error = typeof sp.error === "string" ? sp.error : null;

  const errorKey = error ? `users.${error}` : null;
  const translatedError = errorKey ? t(errorKey) : null;
  const errorText =
    translatedError && translatedError !== errorKey ? translatedError : null;

  let users: AdminUser[] = [];
  let total = 0;
  let limit = 10;
  let hasMore = false;
  try {
    const query = buildQueryString({
      q,
      supportStatus,
      page: currentPage,
      limit,
    });
    const data = await backendJson<UserListResponse>(
      query ? `/api/users?${query}` : "/api/users",
    );
    users = Array.isArray(data.users) ? data.users : [];
    total = typeof data.total === "number" ? data.total : users.length;
    limit = typeof data.limit === "number" && data.limit > 0 ? data.limit : 10;
    hasMore = !!data.hasMore;
  } catch {
    return (
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t("nav.users")}
          </h2>
          <p className="text-sm text-destructive">{t("users.failedToLoad")}</p>
        </div>
      </div>
    );
  }

  const courseById = new Map<number, string>();
  try {
    const data = await backendJson<{ courses: AdminCourse[] }>("/api/courses");
    const courses = Array.isArray(data.courses) ? data.courses : [];
    for (const c of courses) {
      if (!c || typeof c !== "object") continue;
      const id = typeof c.id === "number" ? c.id : null;
      const title = typeof c.title === "string" ? c.title.trim() : "";
      if (!id || id <= 0) continue;
      courseById.set(id, title || `${t("common.course")} #${id}`);
    }
  } catch {
    // ignore: course labels fall back to course id or experience label
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const normalizedPage = Math.min(currentPage, totalPages);
  const buildPageHref = (page: number) =>
    `/admin/users?${buildQueryString({ q, supportStatus, page })}`;

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <h2 className="text-2xl font-semibold tracking-tight">
          {t("nav.users")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {total} {t("users.countLabel")}
        </p>
        {errorText ? (
          <p className="text-sm text-destructive">{errorText}</p>
        ) : null}
      </div>

      <div className="px-4 lg:px-6">
        <form
          method="get"
          action="/admin/users"
          className="grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-[minmax(0,1fr)_12rem_auto_auto]"
        >
          <Input
            name="q"
            defaultValue={q ?? ""}
            placeholder={t("users.searchPlaceholder")}
          />
          <select
            name="supportStatus"
            defaultValue={supportStatus ?? ""}
            className="h-8 w-full min-w-0 rounded-lg border border-input bg-background px-2.5 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          >
            <option value="">{t("common.all")}</option>
            <option value="none">{t("supportStatus.none")}</option>
            <option value="pending">{t("supportStatus.pending")}</option>
            <option value="active">{t("supportStatus.active")}</option>
            <option value="closed">{t("supportStatus.closed")}</option>
          </select>
          <input type="hidden" name="page" value="1" />
          <Button type="submit">{t("common.search")}</Button>
          <Link
            href="/admin/users"
            className={buttonVariants({ variant: "outline" })}
          >
            {t("common.clearFilters")}
          </Link>
        </form>
      </div>

      <div className="px-4 lg:px-6">
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("common.name")}</TableHead>
                <TableHead>{t("common.username")}</TableHead>
                <TableHead>{t("common.phone")}</TableHead>
                <TableHead>{t("common.course")}</TableHead>
                <TableHead>{t("common.goal")}</TableHead>
                <TableHead>{t("common.support")}</TableHead>
                <TableHead>{t("common.operator")}</TableHead>
                <TableHead className="text-right">
                  {t("common.actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <ClickableTableRow key={u.id} href={`/admin/users/${u.id}`}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/admin/users/${u.id}`}
                      className="underline-offset-4 hover:underline"
                    >
                      {u.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatUsername(u.telegramUsername)}
                  </TableCell>
                  <TableCell>{u.phone ?? "—"}</TableCell>
                  <TableCell>{resolveCourseLabel(u, courseById, t)}</TableCell>
                  <TableCell>{u.goal ?? "—"}</TableCell>
                  <TableCell>
                    <SupportStatusSelect
                      action={updateSupportStatusAction.bind(null, u.id)}
                      value={u.supportStatus}
                    />
                  </TableCell>
                  <TableCell>{u.supportAdmin?.name ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/users/${u.id}`}
                        className={buttonVariants({
                          size: "sm",
                          variant: "outline",
                        })}
                      >
                        {t("common.view")}
                      </Link>
                    </div>
                  </TableCell>
                </ClickableTableRow>
              ))}

              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center">
                    {t("users.empty")}
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </div>

      {total > limit ? (
        <div className="flex items-center justify-between gap-3 px-4 lg:px-6">
          <p className="text-sm text-muted-foreground">
            {t("messages.page")} {normalizedPage} / {totalPages}
          </p>
          <div className="flex items-center gap-2">
            {normalizedPage > 1 ? (
              <Link
                href={buildPageHref(normalizedPage - 1)}
                className={buttonVariants({ variant: "outline" })}
              >
                {t("messages.prev")}
              </Link>
            ) : (
              <span className={buttonVariants({ variant: "outline" })}>
                {t("messages.prev")}
              </span>
            )}
            {normalizedPage < totalPages || hasMore ? (
              <Link
                href={buildPageHref(normalizedPage + 1)}
                className={buttonVariants({ variant: "outline" })}
              >
                {t("messages.next")}
              </Link>
            ) : (
              <span className={buttonVariants({ variant: "outline" })}>
                {t("messages.next")}
              </span>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
