import Link from "next/link";

import { ClickableTableRow } from "@/components/admin/clickable-table-row";
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

type GoalRow = {
  id: number;
  title: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export default async function Page() {
  const { t, locale } = await getServerT();

  let goals: GoalRow[] = [];
  try {
    const data = await backendJson<{ goals: GoalRow[] }>("/api/goals");
    goals = Array.isArray(data.goals) ? data.goals : [];
  } catch {
    return (
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t("nav.goals")}
          </h2>
          <p className="text-sm text-destructive">{t("goals.failedToLoad")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="flex items-center justify-between gap-4 px-4 lg:px-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            {t("nav.goals")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {goals.length} {t("goals.countLabel")}
          </p>
        </div>
        <Link href="/goals/create" className={buttonVariants()}>
          {t("goals.createAction")}
        </Link>
      </div>

      <div className="px-4 lg:px-6">
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("common.title")}</TableHead>
                <TableHead>{t("common.status")}</TableHead>
                <TableHead>{t("common.updatedAt")}</TableHead>
                <TableHead className="text-right">
                  {t("common.actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {goals.map((g) => (
                <ClickableTableRow key={g.id} href={`/goals/${g.id}`}>
                  <TableCell className="font-medium">{g.title}</TableCell>
                  <TableCell>
                    <Badge variant={g.isActive ? "default" : "outline"}>
                      {g.isActive ? t("common.active") : t("common.inactive")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(g.updatedAt).toLocaleString(locale)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/goals/${g.id}`}
                        className={buttonVariants({
                          size: "sm",
                          variant: "outline",
                        })}
                      >
                        {t("common.view")}
                      </Link>
                      <Link
                        href={`/goals/edit/${g.id}`}
                        className={buttonVariants({
                          size: "sm",
                          variant: "outline",
                        })}
                      >
                        {t("common.edit")}
                      </Link>
                    </div>
                  </TableCell>
                </ClickableTableRow>
              ))}

              {goals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center">
                    {t("goals.empty")}
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
