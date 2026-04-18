import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { backendJson } from "@/lib/server-backend";

type Admin = {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
};

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let admin: Admin;
  try {
    const data = await backendJson<{ admin: Admin }>(`/api/admins/${id}`);
    admin = data.admin;
  } catch (err) {
    return (
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <h2 className="text-2xl font-semibold tracking-tight">Admin</h2>
          <p className="text-sm text-destructive">
            {err instanceof Error ? err.message : "Failed to load admin"}
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
            {admin.name}
          </h2>
          <p className="text-sm text-muted-foreground">Admin #{admin.id}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admins"
            className={buttonVariants({ variant: "outline" })}
          >
            Back
          </Link>
          <Link href={`/admins/edit/${admin.id}`} className={buttonVariants()}>
            Edit
          </Link>
        </div>
      </div>

      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-1">
              <div className="text-sm text-muted-foreground">Email</div>
              <div className="text-sm">{admin.email}</div>
            </div>

            <div className="grid gap-1">
              <div className="text-sm text-muted-foreground">Role</div>
              <div>
                <Badge variant="outline">{admin.role}</Badge>
              </div>
            </div>

            <div className="grid gap-1">
              <div className="text-sm text-muted-foreground">Created</div>
              <div className="text-sm">
                {new Date(admin.createdAt).toLocaleString()}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
