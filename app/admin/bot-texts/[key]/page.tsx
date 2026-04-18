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
  } catch (err) {
    const url = new URL(
      `/bot-texts/${encodeURIComponent(key)}`,
      "http://local",
    );
    url.searchParams.set(
      "error",
      err instanceof Error ? err.message : "Failed to save bot text",
    );
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
  const { key } = await params;
  const sp = (await searchParams) ?? {};
  const error = typeof sp.error === "string" ? sp.error : null;

  let text: BotText;
  try {
    const data = await backendJson<{ text: BotText }>(
      `/api/admin/bot-texts/${encodeURIComponent(key)}`,
    );
    text = data.text;
  } catch (err) {
    return (
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <h2 className="text-2xl font-semibold tracking-tight">
            Edit bot text
          </h2>
          <p className="text-sm text-destructive">
            {err instanceof Error ? err.message : "Failed to load bot text"}
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
            Edit bot text
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs">
              {text.key}
            </Badge>
            <Badge variant="outline">{text.group}</Badge>
            {text.source === "db" ? (
              <Badge variant="default">Custom</Badge>
            ) : (
              <Badge variant="outline">Default</Badge>
            )}
          </div>
        </div>
        <Link
          href="/bot-texts"
          className={buttonVariants({ variant: "outline" })}
        >
          Back
        </Link>
      </div>

      <div className="px-4 lg:px-6">
        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle>Text value</CardTitle>
            <CardDescription>
              This value is used in the Telegram bot. If you see placeholders
              like <span className="font-mono">{"{username}"}</span>,{" "}
              <span className="font-mono">{"{levels}"}</span>,{" "}
              <span className="font-mono">{"{courseTitle}"}</span>,{" "}
              <span className="font-mono">{"{duration}"}</span>, keep them
              unchanged.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              action={saveBotTextAction.bind(null, key)}
              className="grid gap-4"
            >
              <div className="grid gap-2">
                <Label htmlFor="value">Value</Label>
                <textarea
                  id="value"
                  name="value"
                  required
                  rows={10}
                  defaultValue={text.value}
                  className="min-h-40 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                />
                <p className="text-xs text-muted-foreground">
                  Tip: don’t delete placeholder parts like{" "}
                  <span className="font-mono">{"{username}"}</span>.
                </p>
              </div>

              {error ? (
                <p className="text-sm text-destructive">{error}</p>
              ) : null}

              <div className="flex items-center justify-end gap-2">
                <Link
                  href="/bot-texts"
                  className={buttonVariants({ variant: "outline" })}
                >
                  Cancel
                </Link>
                <Button type="submit">Save</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {text.source === "db" ? (
          <Card className="mt-6 max-w-3xl">
            <CardHeader>
              <CardTitle>Default (fallback)</CardTitle>
              <CardDescription>
                If you remove the DB override, the bot will fall back to this
                value.
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
