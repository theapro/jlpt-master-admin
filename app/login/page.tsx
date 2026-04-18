import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { loginAction } from "./actions";
import { GoogleLoginButton } from "@/components/auth/google-login-button";
import { getServerT } from "@/lib/i18n/server";

type SearchParams = {
  error?: string | string[];
  next?: string | string[];
  success?: string | string[];
};

const firstQueryValue = (value: string | string[] | undefined) =>
  typeof value === "string"
    ? value
    : Array.isArray(value)
      ? value[0]
      : undefined;

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { t } = await getServerT();
  const sp = await searchParams;
  const error = firstQueryValue(sp?.error);
  const success = firstQueryValue(sp?.success);
  const next = firstQueryValue(sp?.next) ?? "/dashboard";

  const errorKey =
    typeof error === "string" && error.trim().length > 0
      ? `auth.${error}`
      : null;
  const translatedError = errorKey ? t(errorKey) : null;
  const errorText =
    translatedError && translatedError !== errorKey ? translatedError : null;

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{t("auth.adminLoginTitle")}</CardTitle>
          <CardDescription>{t("auth.adminLoginDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={loginAction} className="grid gap-4">
            <input type="hidden" name="next" value={next} />
            <div className="grid gap-2">
              <Label htmlFor="email">{t("common.email")}</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">{t("common.password")}</Label>
              <Input id="password" name="password" type="password" required />
              <div className="flex justify-end">
                <Link
                  href="/forgot-password"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  {t("common.forgotPassword")}
                </Link>
              </div>
            </div>
            {errorText ? (
              <p className="text-sm text-destructive">{errorText}</p>
            ) : null}
            {success === "1" ? (
              <p className="text-sm text-foreground">
                {t("auth.resetSuccess")}
              </p>
            ) : null}
            <Button type="submit" className="w-full">
              {t("common.signIn")}
            </Button>
          </form>

          <div className="mt-4 flex justify-center">
            <GoogleLoginButton next={next} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
