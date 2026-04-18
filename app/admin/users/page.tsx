import Link from "next/link";
import { redirect } from "next/navigation";

import { ClickableTableRow } from "@/components/admin/clickable-table-row";
import { SupportStatusSelect } from "@/components/admin/support-status-select";
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

type AdminUser = {
  id: number;
  telegramId: string;
  name: string;
  phone: string | null;
  telegramUsername: string | null;
  telegramNickname: string | null;
  goal: string | null;
  isInSupport: boolean;
  supportStatus: "none" | "pending" | "active" | "closed";
  supportAdmin: { id: number; name: string } | null;
};

const formatUsername = (value: string | null | undefined) => {
  const u = typeof value === "string" ? value.trim() : "";
  if (!u) return "—";
  return `@${u.replace(/^@+/, "")}`;
};

async function updateSupportStatusAction(userId: number, formData: FormData) {
  "use server";

  const supportStatus = String(formData.get("supportStatus") ?? "").trim();

  try {
    await backendJson<{ user: { id: number } }>(
      `/api/users/${userId}/support-status`,
      {
        method: "PATCH",
        body: { supportStatus },
      },
    );

    redirect("/admin/users");
  } catch {
    const url = new URL("/admin/users", "http://local");
    url.searchParams.set("error", "supportStatusUpdateFailed");
    redirect(url.pathname + url.search);
  }
}

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const { t } = await getServerT();
  const sp = (await searchParams) ?? {};
  const error = typeof sp.error === "string" ? sp.error : null;

  const errorKey = error ? `users.${error}` : null;
  const translatedError = errorKey ? t(errorKey) : null;
  const errorText =
    translatedError && translatedError !== errorKey ? translatedError : null;

  let users: AdminUser[] = [];
  try {
    const data = await backendJson<{ users: AdminUser[] }>("/api/users");
    users = Array.isArray(data.users) ? data.users : [];
  } catch {
    return (
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t("nav.users")}
          </h2>
          <p className="text-sm text-destructive">{t("users.failedToLoad")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <h2 className="text-2xl font-semibold tracking-tight">
          {t("nav.users")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {users.length} {t("users.countLabel")}
        </p>
        {errorText ? (
          <p className="text-sm text-destructive">{errorText}</p>
        ) : null}
      </div>

      <div className="px-4 lg:px-6">
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("common.name")}</TableHead>
                <TableHead>{t("common.username")}</TableHead>
                <TableHead>{t("common.phone")}</TableHead>
                <TableHead>{t("common.goal")}</TableHead>
                <TableHead>{t("common.support")}</TableHead>
                <TableHead>{t("common.operator")}</TableHead>
                <TableHead className="text-right">
                  {t("common.actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <ClickableTableRow key={u.id} href={`/admin/users/${u.id}`}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/admin/users/${u.id}`}
                      className="underline-offset-4 hover:underline"
                    >
                      {u.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatUsername(u.telegramUsername)}
                  </TableCell>
                  <TableCell>{u.phone ?? "—"}</TableCell>
                  <TableCell>{u.goal ?? "—"}</TableCell>
                  <TableCell>
                    <SupportStatusSelect
                      action={updateSupportStatusAction.bind(null, u.id)}
                      value={u.supportStatus}
                    />
                  </TableCell>
                  <TableCell>{u.supportAdmin?.name ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/users/${u.id}`}
                        className={buttonVariants({
                          size: "sm",
                          variant: "outline",
                        })}
                      >
                        {t("common.view")}
                      </Link>
                    </div>
                  </TableCell>
                </ClickableTableRow>
              ))}

              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center">
                    {t("users.empty")}
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
