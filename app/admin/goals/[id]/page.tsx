import Link from "next/link";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getServerT } from "@/lib/i18n/server";
import { backendJson } from "@/lib/server-backend";

type Goal = {
  id: number;
  title: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

async function deleteGoalAction(id: string) {
  "use server";

  try {
    await backendJson<{ goal: { id: number } }>(`/api/goals/${id}`, {
      method: "DELETE",
    });
    redirect("/goals");
  } catch {
    const url = new URL(`/goals/${id}`, "http://local");
    url.searchParams.set("error", "deleteFailed");
    redirect(url.pathname + url.search);
  }
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

  const errorKey = error ? `goals.${error}` : null;
  const translatedError = errorKey ? t(errorKey) : null;
  const errorText =
    translatedError && translatedError !== errorKey ? translatedError : null;

  let goal: Goal;
  try {
    const data = await backendJson<{ goal: Goal }>(`/api/goals/${id}`);
    goal = data.goal;
  } catch {
    return (
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t("common.goal")}
          </h2>
          <p className="text-sm text-destructive">
            {t("goals.failedToLoadGoal")}
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
            {goal.title}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("common.goal")} #{goal.id}
          </p>
          {errorText ? (
            <p className="text-sm text-destructive">{errorText}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/goals"
            className={buttonVariants({ variant: "outline" })}
          >
            {t("common.back")}
          </Link>
          <Link href={`/goals/edit/${goal.id}`} className={buttonVariants()}>
            {t("common.edit")}
          </Link>
          <form action={deleteGoalAction.bind(null, id)}>
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
                <Badge variant={goal.isActive ? "default" : "outline"}>
                  {goal.isActive ? t("common.active") : t("common.inactive")}
                </Badge>
              </div>
            </div>

            <div className="grid gap-1">
              <div className="text-sm text-muted-foreground">
                {t("common.createdAt")}
              </div>
              <div className="text-sm">
                {new Date(goal.createdAt).toLocaleString(locale)}
              </div>
            </div>

            <div className="grid gap-1">
              <div className="text-sm text-muted-foreground">
                {t("common.updatedAt")}
              </div>
              <div className="text-sm">
                {new Date(goal.updatedAt).toLocaleString(locale)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
