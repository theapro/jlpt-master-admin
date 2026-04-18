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

type CourseRow = {
  id: number;
  title: string;
  duration: number | null;
  isActive: boolean;
};

export default async function Page() {
  const { t } = await getServerT();

  let courses: CourseRow[] = [];
  try {
    const data = await backendJson<{ courses: CourseRow[] }>("/api/courses");
    courses = Array.isArray(data.courses) ? data.courses : [];
  } catch {
    return (
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t("nav.courses")}
          </h2>
          <p className="text-sm text-destructive">
            {t("courses.failedToLoad")}
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
            {t("nav.courses")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {courses.length} {t("courses.countLabel")}
          </p>
        </div>
        <Link href="/courses/create" className={buttonVariants()}>
          {t("courses.createAction")}
        </Link>
      </div>

      <div className="px-4 lg:px-6">
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("common.title")}</TableHead>
                <TableHead>{t("common.status")}</TableHead>
                <TableHead>{t("common.duration")}</TableHead>
                <TableHead className="text-right">
                  {t("common.actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.map((c) => (
                <ClickableTableRow key={c.id} href={`/courses/${c.id}`}>
                  <TableCell className="font-medium">{c.title}</TableCell>
                  <TableCell>
                    <Badge variant={c.isActive ? "default" : "outline"}>
                      {c.isActive ? t("common.active") : t("common.inactive")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {c.duration
                      ? `${c.duration} ${t("courses.monthUnitShort")}`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/courses/${c.id}`}
                        className={buttonVariants({
                          size: "sm",
                          variant: "outline",
                        })}
                      >
                        {t("common.view")}
                      </Link>
                      <Link
                        href={`/courses/edit/${c.id}`}
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

              {courses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center">
                    {t("courses.empty")}
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
