import Link from "next/link";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { getServerT } from "@/lib/i18n/server";
import { backendJson } from "@/lib/server-backend";

type BotText = {
  key: string;
  value: string;
  defaultValue: string;
  dbValue: string | null;
  source: "db" | "default";
  group: string;
  updatedAt: string | null;
};

async function saveBotTextAction(key: string, formData: FormData) {
  "use server";

  const value = String(formData.get("value") ?? "");

  try {
    await backendJson<{ text: BotText }>(
      `/api/admin/bot-texts/${encodeURIComponent(key)}`,
      {
        method: "PUT",
        body: { value },
      },
    );

    redirect("/bot-texts");
  } catch {
    const url = new URL(
      `/bot-texts/${encodeURIComponent(key)}`,
      "http://local",
    );
    url.searchParams.set("error", "saveFailed");
    redirect(url.pathname + url.search);
  }
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ key: string }>;
  searchParams?: Promise<{ error?: string }>;
}) {
  const { t } = await getServerT();
  const { key } = await params;
  const sp = (await searchParams) ?? {};
  const error = typeof sp.error === "string" ? sp.error : null;

  const errorKey = error ? `botTexts.${error}` : null;
  const translatedError = errorKey ? t(errorKey) : null;
  const errorText =
    translatedError && translatedError !== errorKey ? translatedError : null;

  let text: BotText;
  try {
    const data = await backendJson<{ text: BotText }>(
      `/api/admin/bot-texts/${encodeURIComponent(key)}`,
    );
    text = data.text;
  } catch {
    return (
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t("botTexts.editTitle")}
          </h2>
          <p className="text-sm text-destructive">
            {t("botTexts.failedToLoadOne")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="flex items-center justify-between gap-4 px-4 lg:px-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            {t("botTexts.editTitle")}
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs">
              {text.key}
            </Badge>
            <Badge variant="outline">{text.group}</Badge>
            {text.source === "db" ? (
              <Badge variant="default">{t("common.custom")}</Badge>
            ) : (
              <Badge variant="outline">{t("common.default")}</Badge>
            )}
          </div>
        </div>
        <Link
          href="/bot-texts"
          className={buttonVariants({ variant: "outline" })}
        >
          {t("common.back")}
        </Link>
      </div>

      <div className="px-4 lg:px-6">
        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle>{t("botTexts.valueTitle")}</CardTitle>
            <CardDescription>
              {t("botTexts.placeholdersIntro")}{" "}
              <span className="font-mono">{"{username}"}</span>,{" "}
              <span className="font-mono">{"{levels}"}</span>,{" "}
              <span className="font-mono">{"{courseTitle}"}</span>,{" "}
              <span className="font-mono">{"{duration}"}</span>,{" "}
              {t("botTexts.placeholdersOutro")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              action={saveBotTextAction.bind(null, key)}
              className="grid gap-4"
            >
              <div className="grid gap-2">
                <Label htmlFor="value">{t("common.value")}</Label>
                <textarea
                  id="value"
                  name="value"
                  required
                  rows={10}
                  defaultValue={text.value}
                  className="min-h-40 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                />
                <p className="text-xs text-muted-foreground">
                  {t("botTexts.tip")}{" "}
                  <span className="font-mono">{"{username}"}</span>.
                </p>
              </div>

              {errorText ? (
                <p className="text-sm text-destructive">{errorText}</p>
              ) : null}

              <div className="flex items-center justify-end gap-2">
                <Link
                  href="/bot-texts"
                  className={buttonVariants({ variant: "outline" })}
                >
                  {t("common.cancel")}
                </Link>
                <Button type="submit">{t("common.save")}</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {text.source === "db" ? (
          <Card className="mt-6 max-w-3xl">
            <CardHeader>
              <CardTitle>{t("botTexts.defaultFallbackTitle")}</CardTitle>
              <CardDescription>
                {t("botTexts.defaultFallbackDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap rounded-lg border bg-muted p-3 text-sm">
                {text.defaultValue}
              </pre>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
