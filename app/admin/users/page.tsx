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
  } catch (err) {
    const url = new URL("/admin/users", "http://local");
    url.searchParams.set(
      "error",
      err instanceof Error ? err.message : "Failed to update support status",
    );
    redirect(url.pathname + url.search);
  }
}

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const error = typeof sp.error === "string" ? sp.error : null;

  let users: AdminUser[] = [];
  try {
    const data = await backendJson<{ users: AdminUser[] }>("/api/users");
    users = Array.isArray(data.users) ? data.users : [];
  } catch (err) {
    return (
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <h2 className="text-2xl font-semibold tracking-tight">Users</h2>
          <p className="text-sm text-destructive">
            {err instanceof Error ? err.message : "Failed to load users"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <h2 className="text-2xl font-semibold tracking-tight">Users</h2>
        <p className="text-sm text-muted-foreground">{users.length} users</p>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>

      <div className="px-4 lg:px-6">
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Goal</TableHead>
                <TableHead>Support</TableHead>
                <TableHead>Operator</TableHead>
                <TableHead className="text-right">Actions</TableHead>
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
                        View
                      </Link>
                    </div>
                  </TableCell>
                </ClickableTableRow>
              ))}

              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center">
                    No users yet.
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
