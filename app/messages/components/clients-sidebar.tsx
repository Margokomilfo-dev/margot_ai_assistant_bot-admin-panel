import Link from "next/link";

import {
  formatClientLastMessage,
  getDisplayName,
  getInitials,
} from "../lib/utils";
import type { Client } from "../types";

type ClientsSidebarProps = {
  clients: Client[];
  selectedClientId?: string;
};

function getClientMessageStatusMeta(client: Client) {
  switch (client.last_client_message_status) {
    case "high":
      return {
        label: "High",
        title: "Last client message needs manager attention now",
        className: "bg-rose-50 text-rose-700 ring-rose-200",
      };
    case "middle":
      return {
        label: "Middle",
        title: "Last client message is unread",
        className: "bg-amber-50 text-amber-800 ring-amber-200",
      };
    case "low":
      return {
        label: "Low",
        title: "Last client message is already read",
        className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
      };
    case "bot_replied":
      return {
        label: "Bot replied",
        title: "Last client message was answered by the bot",
        className: "bg-cyan-50 text-cyan-800 ring-cyan-200",
      };
    case "none":
      return null;
  }
}

// Левый список диалогов: показывает клиентов, unread и текущего назначенного менеджера.
export function ClientsSidebar({
  clients,
  selectedClientId,
}: ClientsSidebarProps) {
  return (
    <aside className="border-r border-slate-200 bg-[#f7f8fa]">
      <div className="border-b border-slate-200 px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-950">Clients</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {clients.length} in Supabase
            </p>
          </div>
          <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-500 shadow-sm ring-1 ring-slate-200">
            All
          </span>
        </div>
      </div>

      {clients.length === 0 ? (
        <div className="p-5 text-sm text-slate-500">
          No clients found in Supabase.
        </div>
      ) : (
        <nav className="max-h-[calc(100vh-8.5rem)] space-y-1 overflow-y-auto p-2">
          {clients.map((client) => {
            const isActive = client.id === selectedClientId;
            const clientMessageStatusMeta = getClientMessageStatusMeta(client);
            const rowClassName = `rounded-md px-2 py-2 transition-colors ${
              isActive
                ? "bg-white text-slate-950 shadow-sm ring-1 ring-slate-200"
                : client.needs_manager_attention
                  ? "bg-rose-50/70 text-slate-800 ring-1 ring-rose-100 hover:bg-white hover:text-slate-950"
                : "text-slate-700 hover:bg-white hover:text-slate-950"
            }`;
            const rowContent = (
              <span className="flex items-center gap-2">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    isActive
                      ? "bg-slate-950 text-white"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {getInitials(client)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="block min-w-0 flex-1 truncate text-sm font-semibold leading-4">
                      {getDisplayName(client)}
                    </span>
                    {client.unread_count > 0 ? (
                      <span className="shrink-0 rounded-full bg-rose-600 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-sm">
                        {client.unread_count} unread
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-0.5 block truncate text-[11px] leading-4 text-slate-500">
                    Telegram ID {client.telegram_user_id}
                  </span>
                  <span className="block truncate text-[11px] leading-4 text-slate-400">
                    Last message {formatClientLastMessage(client.last_message_at)}
                  </span>
                </span>
              </span>
            );

            return (
              <div key={client.id} className={rowClassName}>
                {isActive ? (
                  <div aria-current="page">{rowContent}</div>
                ) : (
                  <Link href={`/messages?client=${client.id}`}>
                    {rowContent}
                  </Link>
                )}
                <div className="ml-10 mt-1 flex min-w-0 flex-wrap items-center gap-1.5">
                  {clientMessageStatusMeta ? (
                    <span
                      className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ring-1 ${clientMessageStatusMeta.className}`}
                      title={clientMessageStatusMeta.title}
                    >
                      {clientMessageStatusMeta.label}
                    </span>
                  ) : null}
                  <span
                    className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ring-1 ${
                      client.assignment?.current_manager
                        ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                        : "bg-slate-100 text-slate-500 ring-slate-200"
                    }`}
                  >
                    {client.assignment?.current_manager
                      ? client.assignment.current_manager.name
                      : "No assign"}
                  </span>
                </div>
              </div>
            );
          })}
        </nav>
      )}
    </aside>
  );
}
