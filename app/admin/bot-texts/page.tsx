import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
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

type BotTextRow = {
  key: string;
  value: string;
  source: "db" | "default";
  group: string;
  updatedAt: string | null;
};

const toTitle = (value: string) =>
  value
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((w) => w.slice(0, 1).toUpperCase() + w.slice(1))
    .join(" ");

export default async function Page() {
  const { t } = await getServerT();

  let texts: BotTextRow[] = [];
  try {
    const data = await backendJson<{ texts: BotTextRow[] }>(
      "/api/admin/bot-texts",
    );
    texts = Array.isArray(data.texts) ? data.texts : [];
  } catch {
    return (
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t("nav.botTexts")}
          </h2>
          <p className="text-sm text-destructive">
            {t("botTexts.failedToLoad")}
          </p>
        </div>
      </div>
    );
  }

  const sorted = [...texts].sort((a, b) => {
    const g = (a.group ?? "").localeCompare(b.group ?? "");
    if (g !== 0) return g;
    return (a.key ?? "").localeCompare(b.key ?? "");
  });

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="flex items-center justify-between gap-4 px-4 lg:px-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            {t("nav.botTexts")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("botTexts.description")}
          </p>
        </div>
      </div>

      <div className="px-4 lg:px-6">
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("common.text")}</TableHead>
                <TableHead>{t("common.group")}</TableHead>
                <TableHead>{t("common.value")}</TableHead>
                <TableHead>{t("common.status")}</TableHead>
                <TableHead className="text-right">{t("common.edit")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((row) => (
                <TableRow key={row.key}>
                  <TableCell>
                    <div className="grid gap-1">
                      <p className="font-medium">{toTitle(row.key)}</p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {row.key}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{row.group}</Badge>
                  </TableCell>
                  <TableCell className="max-w-180 whitespace-pre-wrap text-sm">
                    {row.value}
                  </TableCell>
                  <TableCell>
                    {row.source === "db" ? (
                      <Badge variant="default">{t("common.custom")}</Badge>
                    ) : (
                      <Badge variant="outline">{t("common.default")}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/bot-texts/${encodeURIComponent(row.key)}`}
                      className={buttonVariants({
                        size: "sm",
                        variant: "outline",
                      })}
                    >
                      {t("common.edit")}
                    </Link>
                  </TableCell>
                </TableRow>
              ))}

              {sorted.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center">
                    {t("botTexts.empty")}
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
