import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getServerT } from "@/lib/i18n/server";

export default async function NotFound() {
  const { t } = await getServerT();

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{t("pageNotFound")}</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-end">
          <Button render={<a href="/dashboard" />}>{t("nav.dashboard")}</Button>
        </CardContent>
      </Card>
    </div>
  );
}
