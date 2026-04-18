import Link from "next/link";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { backendJson } from "@/lib/server-backend";

type Course = {
  id: number;
  title: string;
  description: string;
  duration: number | null;
  isActive: boolean;
  createdAt: string;
};

async function deleteCourseAction(id: string) {
  "use server";

  try {
    await backendJson<{ course: { id: number } }>(`/api/courses/${id}`, {
      method: "DELETE",
    });
  } catch (err) {
    const url = new URL(`/courses/${id}`, "http://local");
    url.searchParams.set(
      "error",
      err instanceof Error ? err.message : "Failed to delete course",
    );
    redirect(url.pathname + url.search);
  }

  // `redirect()` throws internally; keep it out of the try/catch.
  redirect("/courses");
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ error?: string }>;
}) {
  const { id } = await params;

  const sp = (await searchParams) ?? {};
  const error = typeof sp.error === "string" ? sp.error : null;

  let course: Course;
  try {
    const data = await backendJson<{ course: Course }>(`/api/courses/${id}`);
    course = data.course;
  } catch (err) {
    return (
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <h2 className="text-2xl font-semibold tracking-tight">Course</h2>
          <p className="text-sm text-destructive">
            {err instanceof Error ? err.message : "Failed to load course"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="flex items-center justify-between gap-4 px-4 lg:px-6">
        <div className="min-w-0">
          <h2 className="truncate text-2xl font-semibold tracking-tight">
            {course.title}
          </h2>
          <p className="text-sm text-muted-foreground">Course #{course.id}</p>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/courses"
            className={buttonVariants({ variant: "outline" })}
          >
            Back
          </Link>
          <Link
            href={`/courses/edit/${course.id}`}
            className={buttonVariants()}
          >
            Edit
          </Link>
          <form action={deleteCourseAction.bind(null, id)}>
            <Button type="submit" variant="destructive">
              Delete
            </Button>
          </form>
        </div>
      </div>

      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-1">
              <div className="text-sm text-muted-foreground">Status</div>
              <div>
                <Badge variant={course.isActive ? "default" : "outline"}>
                  {course.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>

            <div className="grid gap-1">
              <div className="text-sm text-muted-foreground">Duration</div>
              <div className="text-sm">
                {course.duration ? `${course.duration} months` : "—"}
              </div>
            </div>

            <div className="grid gap-1">
              <div className="text-sm text-muted-foreground">Created</div>
              <div className="text-sm">
                {new Date(course.createdAt).toLocaleString()}
              </div>
            </div>

            <div className="grid gap-1">
              <div className="text-sm text-muted-foreground">Description</div>
              <div className="text-sm whitespace-pre-wrap">
                {course.description}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
