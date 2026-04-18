import { MessagesClient } from "@/components/admin/messages/messages-client";
import { getBackendUrl } from "@/lib/backend";
import { getAdminTokenFromCookies } from "@/lib/server-backend";
export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<{
    telegramId?: string;
    error?: string;
  }>;
}) {
  const sp = (await searchParams) ?? {};
  const wsToken = await getAdminTokenFromCookies();

  const initialTelegramId =
    typeof sp.telegramId === "string" && sp.telegramId.trim().length > 0
      ? sp.telegramId.trim()
      : null;

  return (
    <MessagesClient
      backendUrl={getBackendUrl()}
      wsToken={wsToken}
      initialTelegramId={initialTelegramId}
    />
  );
}
