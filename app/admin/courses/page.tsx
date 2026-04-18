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

type CourseRow = {
  id: number;
  title: string;
  duration: number | null;
  isActive: boolean;
};

export default async function Page() {
  let courses: CourseRow[] = [];
  try {
    const data = await backendJson<{ courses: CourseRow[] }>("/api/courses");
    courses = Array.isArray(data.courses) ? data.courses : [];
  } catch (err) {
    return (
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <h2 className="text-2xl font-semibold tracking-tight">Courses</h2>
          <p className="text-sm text-destructive">
            {err instanceof Error ? err.message : "Failed to load courses"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="flex items-center justify-between gap-4 px-4 lg:px-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Courses</h2>
          <p className="text-sm text-muted-foreground">
            {courses.length} courses
          </p>
        </div>
        <Link href="/courses/create" className={buttonVariants()}>
          Create course
        </Link>
      </div>

      <div className="px-4 lg:px-6">
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.map((c) => (
                <ClickableTableRow key={c.id} href={`/courses/${c.id}`}>
                  <TableCell className="font-medium">{c.title}</TableCell>
                  <TableCell>
                    <Badge variant={c.isActive ? "default" : "outline"}>
                      {c.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>{c.duration ? `${c.duration} mo` : "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/courses/${c.id}`}
                        className={buttonVariants({
                          size: "sm",
                          variant: "outline",
                        })}
                      >
                        View
                      </Link>
                      <Link
                        href={`/courses/edit/${c.id}`}
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

              {courses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center">
                    No courses yet.
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
