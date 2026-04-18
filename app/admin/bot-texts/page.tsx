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
  let texts: BotTextRow[] = [];
  try {
    const data = await backendJson<{ texts: BotTextRow[] }>(
      "/api/admin/bot-texts",
    );
    texts = Array.isArray(data.texts) ? data.texts : [];
  } catch (err) {
    return (
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <h2 className="text-2xl font-semibold tracking-tight">Bot texts</h2>
          <p className="text-sm text-destructive">
            {err instanceof Error ? err.message : "Failed to load bot texts"}
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
          <h2 className="text-2xl font-semibold tracking-tight">Bot texts</h2>
          <p className="text-sm text-muted-foreground">
            Bot yuboradigan matnlarni shu yerdan tahrirlaysiz. "Default" —
            original, "Custom" — siz o‘zgartirgan.
          </p>
        </div>
      </div>

      <div className="px-4 lg:px-6">
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Text</TableHead>
                <TableHead>Group</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Edit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((t) => (
                <TableRow key={t.key}>
                  <TableCell>
                    <div className="grid gap-1">
                      <p className="font-medium">{toTitle(t.key)}</p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {t.key}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{t.group}</Badge>
                  </TableCell>
                  <TableCell className="max-w-180 whitespace-pre-wrap text-sm">
                    {t.value}
                  </TableCell>
                  <TableCell>
                    {t.source === "db" ? (
                      <Badge variant="default">Custom</Badge>
                    ) : (
                      <Badge variant="outline">Default</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/bot-texts/${encodeURIComponent(t.key)}`}
                      className={buttonVariants({
                        size: "sm",
                        variant: "outline",
                      })}
                    >
                      Edit
                    </Link>
                  </TableCell>
                </TableRow>
              ))}

              {sorted.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center">
                    No bot texts configured.
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
