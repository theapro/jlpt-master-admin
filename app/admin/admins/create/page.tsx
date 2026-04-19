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

type CurrentAdmin = {
  id: number;
  role: string;
};

async function createAdminAction(formData: FormData) {
  "use server";

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "").trim();

  let data: { admin: { id: number } };
  try {
    data = await backendJson<{ admin: { id: number } }>("/api/admins", {
      method: "POST",
      body: { name, email, password, role },
    });
  } catch {
    const url = new URL("/admins/create", "http://local");
    url.searchParams.set("error", "createFailed");
    redirect(url.pathname + url.search);
  }

  // `redirect()` throws internally; keep it out of the try/catch.
  redirect(`/admins/${data.admin.id}`);
}

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const { t } = await getServerT();

  let isSuperAdmin = false;
  try {
    const data = await backendJson<{ admin: CurrentAdmin }>("/api/admin/me");
    isSuperAdmin = data.admin.role === "super_admin";
  } catch {
    isSuperAdmin = false;
  }

  if (!isSuperAdmin) redirect("/admins");

  const sp = (await searchParams) ?? {};
  const error = typeof sp.error === "string" ? sp.error : null;

  const errorKey = error ? `admins.${error}` : null;
  const translatedError = errorKey ? t(errorKey) : null;
  const errorText =
    translatedError && translatedError !== errorKey ? translatedError : null;

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="flex items-center justify-between gap-4 px-4 lg:px-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            {t("admins.createAction")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("admins.createDescription")}
          </p>
        </div>
        <Link href="/admins" className={buttonVariants({ variant: "outline" })}>
          {t("common.back")}
        </Link>
      </div>

      <div className="px-4 lg:px-6">
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>{t("common.details")}</CardTitle>
            <CardDescription>{t("admins.passwordMinLength")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createAdminAction} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">{t("common.name")}</Label>
                <Input id="name" name="name" required />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">{t("common.email")}</Label>
                <Input id="email" name="email" type="email" required />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="role">{t("common.role")}</Label>
                <Select name="role" defaultValue="admin" required>
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
                <Label htmlFor="password">{t("common.password")}</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  minLength={8}
                  required
                />
              </div>

              {errorText ? (
                <p className="text-sm text-destructive">{errorText}</p>
              ) : null}

              <div className="flex items-center justify-end gap-2">
                <Link
                  href="/admins"
                  className={buttonVariants({ variant: "outline" })}
                >
                  {t("common.cancel")}
                </Link>
                <Button type="submit">{t("common.create")}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
