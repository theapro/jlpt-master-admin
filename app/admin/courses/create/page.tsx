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

async function createCourseAction(formData: FormData) {
  "use server";

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const durationRaw = String(formData.get("duration") ?? "").trim();
  const duration = durationRaw.length > 0 ? durationRaw : null;

  let data: { course: { id: number } };
  try {
    data = await backendJson<{ course: { id: number } }>("/api/courses", {
      method: "POST",
      body: { title, description, duration },
    });
  } catch (err) {
    const url = new URL("/courses/create", "http://local");
    url.searchParams.set(
      "error",
      err instanceof Error ? err.message : "Failed to create course",
    );
    redirect(url.pathname + url.search);
  }

  // `redirect()` throws internally; keep it out of the try/catch.
  redirect(`/courses/${data.course.id}`);
}

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const error = typeof sp.error === "string" ? sp.error : null;

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="flex items-center justify-between gap-4 px-4 lg:px-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Create Course
          </h2>
          <p className="text-sm text-muted-foreground">
            Add a new course to the catalog.
          </p>
        </div>
        <Link
          href="/courses"
          className={buttonVariants({ variant: "outline" })}
        >
          Back
        </Link>
      </div>

      <div className="px-4 lg:px-6">
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Course details</CardTitle>
            <CardDescription>
              All fields except duration are required.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createCourseAction} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" required />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="duration">Duration (months)</Label>
                <Input
                  id="duration"
                  name="duration"
                  type="number"
                  min={1}
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
                  className="min-h-28 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                />
              </div>

              {error ? (
                <p className="text-sm text-destructive">{error}</p>
              ) : null}

              <div className="flex items-center justify-end gap-2">
                <Link
                  href="/courses"
                  className={buttonVariants({ variant: "outline" })}
                >
                  Cancel
                </Link>
                <Button type="submit">Create</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
