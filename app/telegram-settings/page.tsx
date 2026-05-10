import { connection } from "next/server";

import { Header } from "../messages/components/header";
import { getAuthorizedManager } from "../messages/queries";
import { getTelegramMenuItems } from "./queries";
import { TelegramSettingsWorkspace } from "./telegram-settings-workspace";

export const dynamic = "force-dynamic";

export default async function TelegramSettingsPage() {
  await connection();

  const manager = await getAuthorizedManager();
  const menuItems = await getTelegramMenuItems();
  const managerName = `${manager.name} ${manager.surname}`;

  return (
    <main className="min-h-screen bg-[#eef2f5] px-3 py-3 text-slate-950 sm:px-4 lg:px-5">
      <div className="mx-auto flex min-h-[calc(100vh-1.5rem)] w-full max-w-7xl flex-col">
        <Header
          title="AI-assistant — Telegram"
          activeSection="telegram-settings"
          managerName={managerName}
          managerPosition={manager.position}
        />
        <TelegramSettingsWorkspace menuItems={menuItems} />
      </div>
    </main>
  );
}
