import Link from "next/link";
import { redirect } from "next/navigation";

import { ClickableTableRow } from "@/components/admin/clickable-table-row";
import { Badge } from "@/components/ui/badge";
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

type AdminRow = {
  id: number;
  name: string;
  email: string;
  tgUsername: string | null;
  role: string;
  createdAt: string;
};

type AdminListResponse = {
  admins: AdminRow[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
};

type CurrentAdmin = {
  id: number;
  role: string;
};

async function deleteAdminAction(id: string) {
  "use server";

  try {
    await backendJson<{ admin: { id: number } }>(`/api/admins/${id}`, {
      method: "DELETE",
    });
  } catch {
    const url = new URL("/admins", "http://local");
    url.searchParams.set("error", "deleteFailed");
    redirect(url.pathname + url.search);
  }

  redirect("/admins");
}

const formatAdminRole = (
  value: string | null | undefined,
  t: (key: string) => string,
) => {
  const v = typeof value === "string" ? value : "";
  if (v === "admin" || v === "teacher") return t("roles.admin");
  if (v === "super_admin") return t("roles.superAdmin");
  return t("roles.unknown");
};

const formatTelegramUsername = (value: string | null | undefined) => {
  const username = typeof value === "string" ? value.trim() : "";
  if (!username) return "—";
  return `@${username.replace(/^@+/, "")}`;
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

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<{
    error?: string;
    q?: string;
    role?: string;
    page?: string;
  }>;
}) {
  const { t } = await getServerT();

  const sp = (await searchParams) ?? {};
  const q = getQueryValue(sp.q);
  const role = getQueryValue(sp.role);
  const currentPage = Math.max(
    1,
    Number.parseInt(getQueryValue(sp.page) ?? "1", 10) || 1,
  );
  const error = typeof sp.error === "string" ? sp.error : null;
  const errorKey = error ? `admins.${error}` : null;
  const translatedError = errorKey ? t(errorKey) : null;
  const errorText =
    translatedError && translatedError !== errorKey ? translatedError : null;

  let admins: AdminRow[] = [];
  let total = 0;
  let limit = 10;
  let hasMore = false;
  let currentAdmin: CurrentAdmin | null = null;

  try {
    const data = await backendJson<{ admin: CurrentAdmin }>("/api/admin/me");
    currentAdmin = data.admin;
  } catch {
    currentAdmin = null;
  }

  const isSuperAdmin = currentAdmin?.role === "super_admin";

  try {
    const query = buildQueryString({ q, role, page: currentPage, limit });
    const data = await backendJson<AdminListResponse>(
      query ? `/api/admins?${query}` : "/api/admins",
    );
    admins = Array.isArray(data.admins) ? data.admins : [];
    total = typeof data.total === "number" ? data.total : admins.length;
    limit = typeof data.limit === "number" && data.limit > 0 ? data.limit : 10;
    hasMore = !!data.hasMore;
  } catch {
    return (
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t("nav.admins")}
          </h2>
          <p className="text-sm text-destructive">{t("admins.failedToLoad")}</p>
        </div>
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const normalizedPage = Math.min(currentPage, totalPages);
  const buildPageHref = (page: number) =>
    `/admins?${buildQueryString({ q, role, page })}`;

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="flex items-center justify-between gap-4 px-4 lg:px-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            {t("nav.admins")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {total} {t("admins.countLabel")}
          </p>
          {errorText ? (
            <p className="text-sm text-destructive">{errorText}</p>
          ) : null}
        </div>
        {isSuperAdmin ? (
          <Link href="/admins/create" className={buttonVariants()}>
            {t("admins.createAction")}
          </Link>
        ) : null}
      </div>

      <div className="px-4 lg:px-6">
        <form
          method="get"
          action="/admins"
          className="grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-[minmax(0,1fr)_12rem_auto_auto]"
        >
          <Input
            name="q"
            defaultValue={q ?? ""}
            placeholder={t("admins.searchPlaceholder")}
          />
          <select
            name="role"
            defaultValue={role ?? ""}
            className="h-8 w-full min-w-0 rounded-lg border border-input bg-background px-2.5 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          >
            <option value="">{t("common.all")}</option>
            <option value="admin">{t("roles.admin")}</option>
            <option value="super_admin">{t("roles.superAdmin")}</option>
          </select>
          <input type="hidden" name="page" value="1" />
          <Button type="submit">{t("common.search")}</Button>
          <Link
            href="/admins"
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
                <TableHead>{t("common.email")}</TableHead>
                <TableHead>{t("common.telegramUsername")}</TableHead>
                <TableHead>{t("common.role")}</TableHead>
                <TableHead className="text-right">
                  {t("common.actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map((a) => (
                <ClickableTableRow key={a.id} href={`/admins/${a.id}`}>
                  <TableCell className="font-medium">{a.name}</TableCell>
                  <TableCell>{a.email}</TableCell>
                  <TableCell>{formatTelegramUsername(a.tgUsername)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {formatAdminRole(a.role, t)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admins/${a.id}`}
                        className={buttonVariants({
                          size: "sm",
                          variant: "outline",
                        })}
                      >
                        {t("common.view")}
                      </Link>
                      {isSuperAdmin ? (
                        <Link
                          href={`/admins/edit/${a.id}`}
                          className={buttonVariants({
                            size: "sm",
                            variant: "outline",
                          })}
                        >
                          {t("common.edit")}
                        </Link>
                      ) : null}
                      {isSuperAdmin && currentAdmin?.id !== a.id ? (
                        <form
                          action={deleteAdminAction.bind(null, String(a.id))}
                        >
                          <Button size="sm" variant="destructive" type="submit">
                            {t("common.delete")}
                          </Button>
                        </form>
                      ) : null}
                    </div>
                  </TableCell>
                </ClickableTableRow>
              ))}

              {admins.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center">
                    {t("admins.empty")}
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
