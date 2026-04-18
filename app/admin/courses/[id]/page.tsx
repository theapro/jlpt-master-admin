import Link from "next/link";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getServerT } from "@/lib/i18n/server";
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
  } catch {
    const url = new URL(`/courses/${id}`, "http://local");
    url.searchParams.set("error", "deleteFailed");
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
  const { t, locale } = await getServerT();
  const { id } = await params;

  const sp = (await searchParams) ?? {};
  const error = typeof sp.error === "string" ? sp.error : null;

  const errorKey = error ? `courses.${error}` : null;
  const translatedError = errorKey ? t(errorKey) : null;
  const errorText =
    translatedError && translatedError !== errorKey ? translatedError : null;

  let course: Course;
  try {
    const data = await backendJson<{ course: Course }>(`/api/courses/${id}`);
    course = data.course;
  } catch {
    return (
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t("common.course")}
          </h2>
          <p className="text-sm text-destructive">
            {t("courses.failedToLoadCourse")}
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
          <p className="text-sm text-muted-foreground">
            {t("common.course")} #{course.id}
          </p>
          {errorText ? (
            <p className="text-sm text-destructive">{errorText}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/courses"
            className={buttonVariants({ variant: "outline" })}
          >
            {t("common.back")}
          </Link>
          <Link
            href={`/courses/edit/${course.id}`}
            className={buttonVariants()}
          >
            {t("common.edit")}
          </Link>
          <form action={deleteCourseAction.bind(null, id)}>
            <Button type="submit" variant="destructive">
              {t("common.delete")}
            </Button>
          </form>
        </div>
      </div>

      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("common.details")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-1">
              <div className="text-sm text-muted-foreground">
                {t("common.status")}
              </div>
              <div>
                <Badge variant={course.isActive ? "default" : "outline"}>
                  {course.isActive ? t("common.active") : t("common.inactive")}
                </Badge>
              </div>
            </div>

            <div className="grid gap-1">
              <div className="text-sm text-muted-foreground">
                {t("common.duration")}
              </div>
              <div className="text-sm">
                {course.duration
                  ? `${course.duration} ${t("courses.monthUnitShort")}`
                  : "—"}
              </div>
            </div>

            <div className="grid gap-1">
              <div className="text-sm text-muted-foreground">
                {t("common.createdAt")}
              </div>
              <div className="text-sm">
                {new Date(course.createdAt).toLocaleString(locale)}
              </div>
            </div>

            <div className="grid gap-1">
              <div className="text-sm text-muted-foreground">
                {t("common.description")}
              </div>
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
