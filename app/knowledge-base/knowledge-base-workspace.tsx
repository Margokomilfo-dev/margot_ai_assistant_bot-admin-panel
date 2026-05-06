"use client";

import { useMemo, useState } from "react";

type KnowledgeArticle = {
  id: string;
  question: string;
  answer: string;
  tag: string;
};

type KnowledgeBaseWorkspaceProps = {
  articles: KnowledgeArticle[];
  qualityChecks: string[];
};

// Интерактивная часть базы знаний: поиск, список карточек и форма будущего сохранения.
export function KnowledgeBaseWorkspace({
  articles,
  qualityChecks,
}: KnowledgeBaseWorkspaceProps) {
  const [searchQuery, setSearchQuery] = useState("");
  // Пока выбора карточек нет, в форме показываем первую заготовку.
  const selectedArticle = articles[0];
  const normalizedQuery = searchQuery.trim().toLowerCase();
  // Пока база знаний работает как визуальная заготовка, поиск фильтрует локальный список.
  // Когда карточки переедут в Supabase, этот блок можно заменить запросом к базе,
  // сохранив для менеджера такое же поведение интерфейса.
  const filteredArticles = useMemo(() => {
    if (!normalizedQuery) {
      return articles;
    }

    return articles.filter((article) =>
      article.question.toLowerCase().includes(normalizedQuery),
    );
  }, [articles, normalizedQuery]);

  return (
    <section className="min-h-[calc(100vh-5.75rem)] rounded-md border border-slate-200 bg-white shadow-[0_12px_32px_rgba(15,23,42,0.07)]">
      <div className="grid min-h-[calc(100vh-5.85rem)] grid-cols-1 overflow-hidden lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="border-b border-slate-200 bg-slate-50/80 lg:border-r lg:border-b-0">
          <div className="border-b border-slate-200 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-slate-950">Материалы</h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  {articles.length} заготовки для AI-ответов
                </p>
              </div>
              <button
                type="button"
                className="h-8 rounded-md bg-slate-950 px-3 text-xs font-semibold text-white transition-colors hover:bg-slate-800"
              >
                Добавить
              </button>
            </div>

            <label className="mt-3 block">
              <span className="sr-only">Поиск по вопросу</span>
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Поиск по вопросу"
                className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-950"
              />
            </label>
          </div>

          <div className="space-y-2 p-3">
            {/* Список слева сразу показывает похожие вопросы по введенному тексту. */}
            {filteredArticles.length > 0 ? (
              filteredArticles.map((article, index) => {
                const isActive = index === 0;

                return (
                  <article
                    key={article.id}
                    className={`rounded-md border p-3 transition-colors ${
                      isActive
                        ? "border-slate-950 bg-white shadow-sm"
                        : "border-slate-200 bg-white/75 hover:border-slate-300 hover:bg-white"
                    }`}
                  >
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-500">
                      {article.tag}
                    </span>
                    <h3 className="mt-2 line-clamp-2 text-sm font-semibold leading-5 text-slate-950">
                      {article.question}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                      {article.answer}
                    </p>
                  </article>
                );
              })
            ) : (
              <div className="rounded-md border border-dashed border-slate-300 bg-white px-3 py-6 text-center">
                <p className="text-sm font-semibold text-slate-800">
                  Похожие вопросы не найдены
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Попробуйте изменить запрос или добавьте новую карточку.
                </p>
              </div>
            )}
          </div>
        </aside>

        <div className="grid min-h-0 grid-cols-1 bg-[#f7f9fb] xl:grid-cols-[minmax(0,1fr)_300px]">
          {/* Центральная форма показывает структуру будущей карточки знания. */}
          <section className="min-w-0 px-4 py-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase text-slate-400">
                  Карточка знания
                </p>
                <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                  Вопрос и ответ для будущего AI
                </h2>
              </div>
              <button
                type="button"
                className="h-9 rounded-md bg-slate-950 px-3 text-xs font-semibold text-white transition-colors hover:bg-slate-800"
              >
                Сохранить
              </button>
            </div>

            <div className="grid gap-3">
              <label className="grid gap-1.5">
                <span className="text-xs font-semibold text-slate-500">
                  Вопрос клиента
                </span>
                <textarea
                  defaultValue={selectedArticle.question}
                  className="min-h-24 resize-none rounded-md border border-slate-200 bg-white px-3 py-2 text-sm leading-6 text-slate-900 outline-none transition-colors focus:border-slate-950"
                />
              </label>

              <label className="grid gap-1.5">
                <span className="text-xs font-semibold text-slate-500">
                  Ответ
                </span>
                <textarea
                  defaultValue={selectedArticle.answer}
                  className="min-h-44 resize-none rounded-md border border-slate-200 bg-white px-3 py-2 text-sm leading-6 text-slate-900 outline-none transition-colors focus:border-slate-950"
                />
              </label>

              <div className="max-w-md">
                <label className="grid gap-1.5">
                  <span className="text-xs font-semibold text-slate-500">
                    Категория
                  </span>
                  <select className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-slate-950">
                    <option>Поддержка</option>
                    <option>Продажи</option>
                    <option>Процессы</option>
                  </select>
                </label>
              </div>
            </div>
          </section>

          {/* Правый блок фиксирует критерии качества перед подключением AI. */}
          <aside className="border-t border-slate-200 bg-white px-4 py-4 xl:border-t-0 xl:border-l">
            <div>
              <h2 className="text-sm font-bold text-slate-950">
                Проверка перед AI
              </h2>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Эти пункты помогут подготовить базу знаний к автоматическим
                ответам.
              </p>
            </div>

            <div className="mt-4 space-y-2">
              {qualityChecks.map((check) => (
                <label
                  key={check}
                  className="flex items-start gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-700"
                >
                  <input
                    type="checkbox"
                    className="mt-1 h-3.5 w-3.5 rounded border-slate-300"
                  />
                  <span>{check}</span>
                </label>
              ))}
            </div>

            <div className="mt-4 rounded-md border border-slate-200 bg-slate-950 px-3 py-3 text-white">
              <p className="text-xs font-semibold uppercase text-white/50">
                Следующий этап
              </p>
              <p className="mt-2 text-sm font-semibold">
                Подключить сохранение карточек в Supabase и использовать их в
                AI-ответах.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
