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

type Admin = {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
};

async function updateAdminAction(id: string, formData: FormData) {
  "use server";

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const body: Record<string, unknown> = { name, email, role };
  if (password.trim().length > 0) body.password = password;

  try {
    await backendJson<{ admin: { id: number } }>(`/api/admins/${id}`, {
      method: "PATCH",
      body,
    });
  } catch (err) {
    const url = new URL(`/admins/edit/${id}`, "http://local");
    url.searchParams.set(
      "error",
      err instanceof Error ? err.message : "Failed to update admin",
    );
    redirect(url.pathname + url.search);
  }

  // `redirect()` throws internally; keep it out of the try/catch.
  redirect(`/admins/${id}`);
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

  let admin: Admin;
  try {
    const data = await backendJson<{ admin: Admin }>(`/api/admins/${id}`);
    admin = data.admin;
  } catch (err) {
    return (
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <h2 className="text-2xl font-semibold tracking-tight">Edit Admin</h2>
          <p className="text-sm text-destructive">
            {err instanceof Error ? err.message : "Failed to load admin"}
          </p>
        </div>
      </div>
    );
  }

  const role = admin.role === "teacher" ? "admin" : admin.role;

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="flex items-center justify-between gap-4 px-4 lg:px-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Edit Admin</h2>
          <p className="text-sm text-muted-foreground">Admin #{admin.id}</p>
        </div>
        <Link
          href={`/admins/${admin.id}`}
          className={buttonVariants({ variant: "outline" })}
        >
          Back
        </Link>
      </div>

      <div className="px-4 lg:px-6">
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Admin details</CardTitle>
            <CardDescription>
              Leave password empty to keep it unchanged.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              action={updateAdminAction.bind(null, id)}
              className="grid gap-4"
            >
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  required
                  defaultValue={admin.name}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  defaultValue={admin.email}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <Select name="role" defaultValue={role} required>
                  <SelectTrigger id="role" className="w-full">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="admin" className="rounded-lg">
                      admin
                    </SelectItem>
                    <SelectItem value="super_admin" className="rounded-lg">
                      super_admin
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">New password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  minLength={8}
                  placeholder="Optional"
                />
              </div>

              {error ? (
                <p className="text-sm text-destructive">{error}</p>
              ) : null}

              <div className="flex items-center justify-end gap-2">
                <Link
                  href={`/admins/${admin.id}`}
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
