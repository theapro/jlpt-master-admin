import { BotButtonsClient } from "./bot-buttons-client";

export default function Page() {
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="flex items-center justify-between gap-4 px-4 lg:px-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Bot buttons</h2>
          <p className="text-sm text-muted-foreground">
            Configure reply keyboard per state
          </p>
        </div>
      </div>

      <div className="px-4 lg:px-6">
        <BotButtonsClient />
      </div>
    </div>
  );
}
