import Link from "next/link";

import { logoutAction } from "../actions";

type HeaderProps = {
  title?: string;
  activeSection?:
    | "messages"
    | "knowledge-base"
    | "chatbot-settings"
    | "telegram-settings";
  managerName: string;
  managerPosition: string;
};

const navItems = [
  { href: "/messages", label: "Сообщения", section: "messages" },
  {
    href: "/knowledge-base",
    label: "База знаний",
    section: "knowledge-base",
  },
  {
    href: "/telegram-settings",
    label: "Telegram",
    section: "telegram-settings",
  },
  {
    href: "/chatbot-settings",
    label: "AI настройка",
    section: "chatbot-settings",
  },

] as const;

// Общая шапка админки: навигация между разделами и профиль текущего менеджера.
export function Header({
  title = "AI-assistant",
  activeSection = "messages",
  managerName,
  managerPosition,
}: HeaderProps) {
  return (
    <header className="mb-3 flex flex-col gap-2 border-b border-slate-200 pb-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-bold tracking-tight">{title}</h1>
        <nav className="flex rounded-md border border-slate-200 bg-white p-0.5 shadow-sm">
          {navItems.map((item) => {
            const isActive = item.section === activeSection;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded px-3 py-1.5 text-xs font-semibold transition-colors ${
                  isActive
                    ? "bg-slate-950 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="flex items-center gap-2">
        <div className="text-right">
          <p className="text-sm font-semibold text-slate-800">{managerName}</p>
          <p className="mt-0.5 text-xs font-medium text-slate-500">
            {managerPosition}
          </p>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-950"
          >
            Выйти
          </button>
        </form>
      </div>
    </header>
  );
}
