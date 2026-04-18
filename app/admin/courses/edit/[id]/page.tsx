import Link from "next/link";
import { redirect } from "next/navigation";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { backendJson } from "@/lib/server-backend";

type Course = {
  id: number;
  title: string;
  description: string;
  duration: number | null;
};

async function updateCourseAction(id: string, formData: FormData) {
  "use server";

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const durationRaw = String(formData.get("duration") ?? "").trim();
  const duration = durationRaw.length > 0 ? durationRaw : null;

  try {
    await backendJson<{ course: { id: number } }>(`/api/courses/${id}`, {
      method: "PATCH",
      body: { title, description, duration },
    });
  } catch (err) {
    const url = new URL(`/courses/edit/${id}`, "http://local");
    url.searchParams.set(
      "error",
      err instanceof Error ? err.message : "Failed to update course",
    );
    redirect(url.pathname + url.search);
  }

  // `redirect()` throws internally; keep it out of the try/catch.
  redirect(`/courses/${id}`);
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
          <h2 className="text-2xl font-semibold tracking-tight">Edit Course</h2>
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
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Edit Course</h2>
          <p className="text-sm text-muted-foreground">Course #{course.id}</p>
        </div>
        <Link
          href={`/courses/${course.id}`}
          className={buttonVariants({ variant: "outline" })}
        >
          Back
        </Link>
      </div>

      <div className="px-4 lg:px-6">
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Course details</CardTitle>
            <CardDescription>Update course fields and save.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              action={updateCourseAction.bind(null, id)}
              className="grid gap-4"
            >
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  required
                  defaultValue={course.title}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="duration">Duration (months)</Label>
                <Input
                  id="duration"
                  name="duration"
                  type="number"
                  min={1}
                  defaultValue={course.duration ?? ""}
                  placeholder="Optional"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  name="description"
                  required
                  rows={6}
                  defaultValue={course.description}
                  className="min-h-28 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                />
              </div>

              {error ? (
                <p className="text-sm text-destructive">{error}</p>
              ) : null}

              <div className="flex items-center justify-end gap-2">
                <Link
                  href={`/courses/${course.id}`}
                  className={buttonVariants({ variant: "outline" })}
                >
                  Cancel
                </Link>
                <Button type="submit">Save</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
