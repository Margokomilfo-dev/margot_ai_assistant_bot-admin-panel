import { ChatPanel } from "./components/chat-panel";
import { ClientsSidebar } from "./components/clients-sidebar";
import { Header } from "./components/header";
import { MessagesRealtime } from "./components/messages-realtime";
import { connection } from "next/server";
import {
  getAuthorizedManager,
  getClients,
  getManagers,
  getMessagesByClientId,
} from "./queries";
import { dialogStatusOptions, urgencyLevelOptions } from "./lib/client-options";
import type {
  ClientDialogStatus,
  ClientFilters,
  ClientSortKey,
  ClientUrgencyLevel,
} from "./types";

export const dynamic = "force-dynamic";

type MessagesPageProps = {
  searchParams: Promise<{
    client?: string | string[];
    manager?: string | string[];
    priority?: string | string[];
    q?: string | string[];
    sort?: string | string[];
    status?: string | string[];
  }>;
};

const dialogStatuses = new Set<ClientDialogStatus>(
  dialogStatusOptions.map((option) => option.value),
);

const urgencyLevels = new Set<ClientUrgencyLevel>(
  urgencyLevelOptions.map((option) => option.value),
);

const clientSortKeys = new Set<ClientSortKey>([
  "last_message_desc",
  "last_message_asc",
  "priority_desc",
  "priority_asc",
  "manager_asc",
  "manager_desc",
  "name_asc",
  "name_desc",
]);

function getSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getClientFilters(
  query: Awaited<MessagesPageProps["searchParams"]>,
): ClientFilters {
  const status = getSearchValue(query.status);
  const priority = getSearchValue(query.priority);
  const sort = getSearchValue(query.sort);

  return {
    status:
      status && dialogStatuses.has(status as ClientDialogStatus)
        ? (status as ClientDialogStatus)
        : "all",
    priority:
      priority && urgencyLevels.has(priority as ClientUrgencyLevel)
        ? (priority as ClientUrgencyLevel)
        : "all",
    managerId: getSearchValue(query.manager) ?? "",
    search: getSearchValue(query.q) ?? "",
    sort:
      sort && clientSortKeys.has(sort as ClientSortKey)
        ? (sort as ClientSortKey)
        : "last_message_desc",
  };
}

// Серверная страница собирает данные для всего интерфейса сообщений.
export default async function MessagesPage({ searchParams }: MessagesPageProps) {
  await connection();

  const manager = await getAuthorizedManager();
  const managers = await getManagers();
  const query = await searchParams;
  const clientFilters = getClientFilters(query);
  const clients = await getClients(managers, manager.id, clientFilters);
  // URL-параметр client управляет выбранным диалогом; без него открываем первого клиента.
  const clientParam = getSearchValue(query.client);
  const selectedClient =
    clients.find((client) => client.id === clientParam) ?? clients[0] ?? null;
  const messages = selectedClient
    ? await getMessagesByClientId(selectedClient.id, managers)
    : [];
  const managerName = `${manager.name} ${manager.surname}`;
  const unreadCount = clients.reduce(
    (count, client) => count + client.unread_count,
    0,
  );

  return (
    <main className="min-h-screen bg-[#eef2f5] px-3 py-3 text-slate-950 sm:px-4 lg:px-5">
      <div className="mx-auto flex min-h-[calc(100vh-1.5rem)] w-full max-w-7xl flex-col">
        <MessagesRealtime unreadCount={unreadCount} />
        <Header
          title="AI-assistant — Сообщения"
          activeSection="messages"
          managerName={managerName}
          managerPosition={manager.position}
        />

        <section className="h-[calc(100vh-5.75rem)] min-h-[520px] overflow-x-auto rounded-md border border-slate-200 bg-white shadow-[0_12px_32px_rgba(15,23,42,0.07)]">
          <div className="grid h-full min-w-[780px] grid-cols-[300px_minmax(0,1fr)]">
            <ClientsSidebar
              clients={clients}
              filters={clientFilters}
              managers={managers}
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
