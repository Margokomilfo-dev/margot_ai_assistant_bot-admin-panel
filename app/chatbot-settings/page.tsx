import { connection } from "next/server";

import { Header } from "../messages/components/header";
import { getAuthorizedManager } from "../messages/queries";
import { ChatbotSettingsWorkspace } from "./chatbot-settings-workspace";
import { getChatbotInstructions } from "./queries";

export const dynamic = "force-dynamic";

export default async function ChatbotSettingsPage() {
  await connection();

  const manager = await getAuthorizedManager();
  const instructions = await getChatbotInstructions();
  const managerName = `${manager.name} ${manager.surname}`;

  return (
    <main className="min-h-screen bg-[#eef2f5] px-3 py-3 text-slate-950 sm:px-4 lg:px-5">
      <div className="mx-auto flex min-h-[calc(100vh-1.5rem)] w-full max-w-7xl flex-col">
        <Header
          title="AI-assistant — Чатбот"
          activeSection="chatbot-settings"
          managerName={managerName}
          managerPosition={manager.position}
        />
        <ChatbotSettingsWorkspace instructions={instructions} />
      </div>
    </main>
  );
}
