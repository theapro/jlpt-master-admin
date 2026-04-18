import { BotButtonsClient } from "./bot-buttons-client";

import { getServerT } from "@/lib/i18n/server";

export default async function Page() {
  const { t } = await getServerT();

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="flex items-center justify-between gap-4 px-4 lg:px-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            {t("nav.botButtons")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("botButtons.description")}
          </p>
        </div>
      </div>

      <div className="px-4 lg:px-6">
        <BotButtonsClient />
      </div>
    </div>
  );
}
