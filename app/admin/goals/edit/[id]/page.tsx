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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getServerT } from "@/lib/i18n/server";
import { backendJson } from "@/lib/server-backend";

type Goal = {
  id: number;
  title: string;
  isActive: boolean;
};

async function updateGoalAction(id: string, formData: FormData) {
  "use server";

  const title = String(formData.get("title") ?? "").trim();
  const isActive = String(formData.get("isActive") ?? "true").trim();

  try {
    await backendJson<{ goal: { id: number } }>(`/api/goals/${id}`, {
      method: "PATCH",
      body: { title, isActive },
    });

    redirect(`/goals/${id}`);
  } catch {
    const url = new URL(`/goals/edit/${id}`, "http://local");
    url.searchParams.set("error", "updateFailed");
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
  const { t } = await getServerT();
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
            {t("goals.editAction")}
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
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            {t("goals.editAction")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("common.goal")} #{goal.id}
          </p>
        </div>
        <Link
          href={`/goals/${goal.id}`}
          className={buttonVariants({ variant: "outline" })}
        >
          {t("common.back")}
        </Link>
      </div>

      <div className="px-4 lg:px-6">
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>{t("common.details")}</CardTitle>
            <CardDescription>{t("goals.editDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              action={updateGoalAction.bind(null, id)}
              className="grid gap-4"
            >
              <div className="grid gap-2">
                <Label htmlFor="title">{t("common.title")}</Label>
                <Input
                  id="title"
                  name="title"
                  defaultValue={goal.title}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="isActive">{t("common.status")}</Label>
                <Select
                  name="isActive"
                  defaultValue={goal.isActive ? "true" : "false"}
                  required
                >
                  <SelectTrigger id="isActive" className="w-full">
                    <SelectValue placeholder={t("common.selectStatus")} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="true" className="rounded-lg">
                      {t("common.active")}
                    </SelectItem>
                    <SelectItem value="false" className="rounded-lg">
                      {t("common.inactive")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {errorText ? (
                <p className="text-sm text-destructive">{errorText}</p>
              ) : null}

              <div className="flex items-center justify-end gap-2">
                <Link
                  href={`/goals/${goal.id}`}
                  className={buttonVariants({ variant: "outline" })}
                >
                  {t("common.cancel")}
                </Link>
                <Button type="submit">{t("common.save")}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
