import Link from "next/link";
import { redirect } from "next/navigation";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getServerT } from "@/lib/i18n/server";
import { backendJson } from "@/lib/server-backend";

type Admin = {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
};

async function updateAdminAction(id: string, formData: FormData) {
  "use server";

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const body: Record<string, unknown> = { name, email, role };
  if (password.trim().length > 0) body.password = password;

  try {
    await backendJson<{ admin: { id: number } }>(`/api/admins/${id}`, {
      method: "PATCH",
      body,
    });
  } catch {
    const url = new URL(`/admins/edit/${id}`, "http://local");
    url.searchParams.set("error", "updateFailed");
    redirect(url.pathname + url.search);
  }

  // `redirect()` throws internally; keep it out of the try/catch.
  redirect(`/admins/${id}`);
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ error?: string }>;
}) {
  const { t } = await getServerT();
  const { id } = await params;

  const sp = (await searchParams) ?? {};
  const error = typeof sp.error === "string" ? sp.error : null;

  const errorKey = error ? `admins.${error}` : null;
  const translatedError = errorKey ? t(errorKey) : null;
  const errorText =
    translatedError && translatedError !== errorKey ? translatedError : null;

  let admin: Admin;
  try {
    const data = await backendJson<{ admin: Admin }>(`/api/admins/${id}`);
    admin = data.admin;
  } catch {
    return (
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t("admins.editAction")}
          </h2>
          <p className="text-sm text-destructive">
            {t("admins.failedToLoadAdmin")}
          </p>
        </div>
      </div>
    );
  }

  const role = admin.role === "teacher" ? "admin" : admin.role;

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="flex items-center justify-between gap-4 px-4 lg:px-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            {t("admins.editAction")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("nav.admin")} #{admin.id}
          </p>
        </div>
        <Link
          href={`/admins/${admin.id}`}
          className={buttonVariants({ variant: "outline" })}
        >
          {t("common.back")}
        </Link>
      </div>

      <div className="px-4 lg:px-6">
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>{t("common.details")}</CardTitle>
            <CardDescription>{t("admins.passwordOptional")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              action={updateAdminAction.bind(null, id)}
              className="grid gap-4"
            >
              <div className="grid gap-2">
                <Label htmlFor="name">{t("common.name")}</Label>
                <Input
                  id="name"
                  name="name"
                  required
                  defaultValue={admin.name}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">{t("common.email")}</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  defaultValue={admin.email}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="role">{t("common.role")}</Label>
                <Select name="role" defaultValue={role} required>
                  <SelectTrigger id="role" className="w-full">
                    <SelectValue placeholder={t("common.selectRole")} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="admin" className="rounded-lg">
                      {t("roles.admin")}
                    </SelectItem>
                    <SelectItem value="super_admin" className="rounded-lg">
                      {t("roles.superAdmin")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">{t("common.newPassword")}</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  minLength={8}
                  placeholder={t("common.optional")}
                />
              </div>

              {errorText ? (
                <p className="text-sm text-destructive">{errorText}</p>
              ) : null}

              <div className="flex items-center justify-end gap-2">
                <Link
                  href={`/admins/${admin.id}`}
                  className={buttonVariants({ variant: "outline" })}
                >
                  {t("common.cancel")}
                </Link>
                <Button type="submit">{t("common.save")}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
