import Link from "next/link";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { backendJson } from "@/lib/server-backend";

type Goal = {
  id: number;
  title: string;
  isActive: boolean;
  sortOrder: number;
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
  } catch (err) {
    const url = new URL(`/goals/${id}`, "http://local");
    url.searchParams.set(
      "error",
      err instanceof Error ? err.message : "Failed to delete goal",
    );
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
  const { id } = await params;

  const sp = (await searchParams) ?? {};
  const error = typeof sp.error === "string" ? sp.error : null;

  let goal: Goal;
  try {
    const data = await backendJson<{ goal: Goal }>(`/api/goals/${id}`);
    goal = data.goal;
  } catch (err) {
    return (
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <h2 className="text-2xl font-semibold tracking-tight">Goal</h2>
          <p className="text-sm text-destructive">
            {err instanceof Error ? err.message : "Failed to load goal"}
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
          <p className="text-sm text-muted-foreground">Goal #{goal.id}</p>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/goals"
            className={buttonVariants({ variant: "outline" })}
          >
            Back
          </Link>
          <Link href={`/goals/edit/${goal.id}`} className={buttonVariants()}>
            Edit
          </Link>
          <form action={deleteGoalAction.bind(null, id)}>
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
                <Badge variant={goal.isActive ? "default" : "outline"}>
                  {goal.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>

            <div className="grid gap-1">
              <div className="text-sm text-muted-foreground">Sort order</div>
              <div className="text-sm font-mono">{goal.sortOrder}</div>
            </div>

            <div className="grid gap-1">
              <div className="text-sm text-muted-foreground">Created</div>
              <div className="text-sm">
                {new Date(goal.createdAt).toLocaleString()}
              </div>
            </div>

            <div className="grid gap-1">
              <div className="text-sm text-muted-foreground">Updated</div>
              <div className="text-sm">
                {new Date(goal.updatedAt).toLocaleString()}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
