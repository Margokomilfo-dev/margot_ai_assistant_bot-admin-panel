import { ChatPanel } from "./chat-panel";
import { ClientsSidebar } from "./clients-sidebar";
import { Header } from "./header";
import { MessagesRealtime } from "./messages-realtime";
import {
  getAuthorizedManager,
  getClients,
  getManagers,
  getMessagesByClientId,
} from "./queries";

export const dynamic = "force-dynamic";

type MessagesPageProps = {
  searchParams: Promise<{
    client?: string | string[];
  }>;
};

// Серверная страница собирает данные для всего интерфейса сообщений.
export default async function MessagesPage({ searchParams }: MessagesPageProps) {
  const manager = await getAuthorizedManager();
  const managers = await getManagers();
  const clients = await getClients(managers, manager.id);
  const query = await searchParams;
  // URL-параметр client управляет выбранным диалогом; без него открываем первого клиента.
  const clientParam = Array.isArray(query.client) ? query.client[0] : query.client;
  const selectedClient =
    clients.find((client) => client.id === clientParam) ?? clients[0] ?? null;
  const messages = selectedClient
    ? await getMessagesByClientId(selectedClient.id)
    : [];
  const managerName = `${manager.name} ${manager.surname}`;

  return (
    <main className="min-h-screen bg-[#eef2f5] px-3 py-3 text-slate-950 sm:px-4 lg:px-5">
      <div className="mx-auto flex min-h-[calc(100vh-1.5rem)] w-full max-w-7xl flex-col">
        <MessagesRealtime />
        <Header
          title="Astro-Bot — Сообщения"
          activeSection="messages"
          managerName={managerName}
          managerPosition={manager.position}
        />

        <section className="h-[calc(100vh-5.75rem)] min-h-[520px] overflow-x-auto rounded-md border border-slate-200 bg-white shadow-[0_12px_32px_rgba(15,23,42,0.07)]">
          <div className="grid h-full min-w-[780px] grid-cols-[300px_minmax(0,1fr)]">
            <ClientsSidebar
              clients={clients}
              selectedClientId={selectedClient?.id}
            />
            <div className="flex min-h-0 flex-col bg-[#e9eef3]">
              <ChatPanel
                selectedClient={selectedClient}
                messages={messages}
                managers={managers}
                currentManager={manager}
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
