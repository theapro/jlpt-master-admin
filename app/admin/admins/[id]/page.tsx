import Link from "next/link";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getServerT } from "@/lib/i18n/server";
import { backendJson } from "@/lib/server-backend";

type Admin = {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
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
    const url = new URL(`/admins/${id}`, "http://local");
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

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ error?: string }>;
}) {
  const { t, locale } = await getServerT();
  const { id } = await params;

  const sp = (await searchParams) ?? {};
  const error = typeof sp.error === "string" ? sp.error : null;
  const errorKey = error ? `admins.${error}` : null;
  const translatedError = errorKey ? t(errorKey) : null;
  const errorText =
    translatedError && translatedError !== errorKey ? translatedError : null;

  let currentAdmin: CurrentAdmin | null = null;
  try {
    const data = await backendJson<{ admin: CurrentAdmin }>("/api/admin/me");
    currentAdmin = data.admin;
  } catch {
    currentAdmin = null;
  }

  const isSuperAdmin = currentAdmin?.role === "super_admin";

  let admin: Admin;
  try {
    const data = await backendJson<{ admin: Admin }>(`/api/admins/${id}`);
    admin = data.admin;
  } catch {
    return (
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t("nav.admin")}
          </h2>
          <p className="text-sm text-destructive">
            {t("admins.failedToLoadAdmin")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="flex items-center justify-between gap-4 px-4 lg:px-6">
        <div className="min-w-0">
          <h2 className="truncate text-2xl font-semibold tracking-tight">
            {admin.name}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("nav.admin")} #{admin.id}
          </p>
          {errorText ? (
            <p className="text-sm text-destructive">{errorText}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admins"
            className={buttonVariants({ variant: "outline" })}
          >
            {t("common.back")}
          </Link>
          {isSuperAdmin ? (
            <Link
              href={`/admins/edit/${admin.id}`}
              className={buttonVariants()}
            >
              {t("common.edit")}
            </Link>
          ) : null}
          {isSuperAdmin && currentAdmin?.id !== admin.id ? (
            <form action={deleteAdminAction.bind(null, id)}>
              <Button type="submit" variant="destructive">
                {t("common.delete")}
              </Button>
            </form>
          ) : null}
        </div>
      </div>

      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("common.details")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-1">
              <div className="text-sm text-muted-foreground">
                {t("common.email")}
              </div>
              <div className="text-sm">{admin.email}</div>
            </div>

            <div className="grid gap-1">
              <div className="text-sm text-muted-foreground">
                {t("common.role")}
              </div>
              <div>
                <Badge variant="outline">
                  {formatAdminRole(admin.role, t)}
                </Badge>
              </div>
            </div>

            <div className="grid gap-1">
              <div className="text-sm text-muted-foreground">
                {t("common.createdAt")}
              </div>
              <div className="text-sm">
                {new Date(admin.createdAt).toLocaleString(locale)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
