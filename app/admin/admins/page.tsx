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
import { backendJson } from "@/lib/server-backend";

type AdminRow = {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
};

export default async function Page() {
  let admins: AdminRow[] = [];
  try {
    const data = await backendJson<{ admins: AdminRow[] }>("/api/admins");
    admins = Array.isArray(data.admins) ? data.admins : [];
  } catch (err) {
    return (
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <h2 className="text-2xl font-semibold tracking-tight">Admins</h2>
          <p className="text-sm text-destructive">
            {err instanceof Error ? err.message : "Failed to load admins"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="flex items-center justify-between gap-4 px-4 lg:px-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Admins</h2>
          <p className="text-sm text-muted-foreground">
            {admins.length} admins
          </p>
        </div>
        <Link href="/admins/create" className={buttonVariants()}>
          Create admin
        </Link>
      </div>

      <div className="px-4 lg:px-6">
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map((a) => (
                <ClickableTableRow key={a.id} href={`/admins/${a.id}`}>
                  <TableCell className="font-medium">{a.name}</TableCell>
                  <TableCell>{a.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{a.role}</Badge>
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
                        View
                      </Link>
                      <Link
                        href={`/admins/edit/${a.id}`}
                        className={buttonVariants({
                          size: "sm",
                          variant: "outline",
                        })}
                      >
                        Edit
                      </Link>
                    </div>
                  </TableCell>
                </ClickableTableRow>
              ))}

              {admins.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center">
                    No admins.
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
