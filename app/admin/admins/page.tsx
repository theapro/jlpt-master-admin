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

type AdminRow = {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
};

const formatAdminRole = (
  value: string | null | undefined,
  t: (key: string) => string,
) => {
  const v = typeof value === "string" ? value : "";
  if (v === "admin" || v === "teacher") return t("roles.admin");
  if (v === "super_admin") return t("roles.superAdmin");
  return t("roles.unknown");
};

export default async function Page() {
  const { t } = await getServerT();

  let admins: AdminRow[] = [];
  try {
    const data = await backendJson<{ admins: AdminRow[] }>("/api/admins");
    admins = Array.isArray(data.admins) ? data.admins : [];
  } catch {
    return (
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t("nav.admins")}
          </h2>
          <p className="text-sm text-destructive">{t("admins.failedToLoad")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="flex items-center justify-between gap-4 px-4 lg:px-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            {t("nav.admins")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {admins.length} {t("admins.countLabel")}
          </p>
        </div>
        <Link href="/admins/create" className={buttonVariants()}>
          {t("admins.createAction")}
        </Link>
      </div>

      <div className="px-4 lg:px-6">
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("common.name")}</TableHead>
                <TableHead>{t("common.email")}</TableHead>
                <TableHead>{t("common.role")}</TableHead>
                <TableHead className="text-right">
                  {t("common.actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map((a) => (
                <ClickableTableRow key={a.id} href={`/admins/${a.id}`}>
                  <TableCell className="font-medium">{a.name}</TableCell>
                  <TableCell>{a.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {formatAdminRole(a.role, t)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admins/${a.id}`}
                        className={buttonVariants({
                          size: "sm",
                          variant: "outline",
                        })}
                      >
                        {t("common.view")}
                      </Link>
                      <Link
                        href={`/admins/edit/${a.id}`}
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

              {admins.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center">
                    {t("admins.empty")}
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
