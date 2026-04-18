import Link from "next/link";

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

import { resetPasswordAction } from "./actions";
import { getServerT } from "@/lib/i18n/server";

type SearchParams = {
  token?: string | string[];
  error?: string | string[];
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
  const token = firstQueryValue(sp?.token) ?? "";
  const error = firstQueryValue(sp?.error);

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
          <CardTitle>{t("auth.resetPasswordTitle")}</CardTitle>
          <CardDescription>
            {t("auth.resetPasswordDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={resetPasswordAction} className="grid gap-4">
            <input type="hidden" name="token" value={token} />

            <div className="grid gap-2">
              <Label htmlFor="password">{t("common.newPassword")}</Label>
              <Input id="password" name="password" type="password" required />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">
                {t("common.confirmPassword")}
              </Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
              />
            </div>

            {errorText ? (
              <p className="text-sm text-destructive">{errorText}</p>
            ) : null}

            <Button type="submit" className="w-full">
              {t("common.resetPassword")}
            </Button>
          </form>

          <div className="mt-4 flex justify-center">
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {t("common.backToLogin")}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
