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

type GoalRow = {
  id: number;
  title: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export default async function Page() {
  let goals: GoalRow[] = [];
  try {
    const data = await backendJson<{ goals: GoalRow[] }>("/api/goals");
    goals = Array.isArray(data.goals) ? data.goals : [];
  } catch (err) {
    return (
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <h2 className="text-2xl font-semibold tracking-tight">Goals</h2>
          <p className="text-sm text-destructive">
            {err instanceof Error ? err.message : "Failed to load goals"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="flex items-center justify-between gap-4 px-4 lg:px-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Goals</h2>
          <p className="text-sm text-muted-foreground">{goals.length} goals</p>
        </div>
        <Link href="/goals/create" className={buttonVariants()}>
          Create goal
        </Link>
      </div>

      <div className="px-4 lg:px-6">
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sort</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {goals.map((g) => (
                <ClickableTableRow key={g.id} href={`/goals/${g.id}`}>
                  <TableCell className="font-medium">{g.title}</TableCell>
                  <TableCell>
                    <Badge variant={g.isActive ? "default" : "outline"}>
                      {g.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {g.sortOrder}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(g.updatedAt).toLocaleString()}
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
                        View
                      </Link>
                      <Link
                        href={`/goals/edit/${g.id}`}
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

              {goals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center">
                    No goals yet.
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
