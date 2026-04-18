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
import { backendJson } from "@/lib/server-backend";

async function createGoalAction(formData: FormData) {
  "use server";

  const title = String(formData.get("title") ?? "").trim();
  const sortOrderRaw = String(formData.get("sortOrder") ?? "").trim();
  const isActive = String(formData.get("isActive") ?? "true").trim();

  const sortOrder = sortOrderRaw.length > 0 ? sortOrderRaw : 0;

  try {
    const data = await backendJson<{ goal: { id: number } }>("/api/goals", {
      method: "POST",
      body: { title, sortOrder, isActive },
    });

    redirect(`/goals/${data.goal.id}`);
  } catch (err) {
    const url = new URL("/goals/create", "http://local");
    url.searchParams.set(
      "error",
      err instanceof Error ? err.message : "Failed to create goal",
    );
    redirect(url.pathname + url.search);
  }
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
          <h2 className="text-2xl font-semibold tracking-tight">Create Goal</h2>
          <p className="text-sm text-muted-foreground">
            Add a new goal for onboarding.
          </p>
        </div>
        <Link href="/goals" className={buttonVariants({ variant: "outline" })}>
          Back
        </Link>
      </div>

      <div className="px-4 lg:px-6">
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Goal details</CardTitle>
            <CardDescription>
              Active goals are shown to users in the bot.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createGoalAction} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" required />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="isActive">Status</Label>
                <Select name="isActive" defaultValue="true" required>
                  <SelectTrigger id="isActive" className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="true" className="rounded-lg">
                      Active
                    </SelectItem>
                    <SelectItem value="false" className="rounded-lg">
                      Inactive
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="sortOrder">Sort order</Label>
                <Input
                  id="sortOrder"
                  name="sortOrder"
                  type="number"
                  step="1"
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">
                  Lower numbers appear first.
                </p>
              </div>

              {error ? (
                <p className="text-sm text-destructive">{error}</p>
              ) : null}

              <div className="flex items-center justify-end gap-2">
                <Link
                  href="/goals"
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
