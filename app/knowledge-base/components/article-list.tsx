"use client";

import type { KnowledgeArticle } from "../knowledge-base-workspace";

type KnowledgeArticleListProps = {
  articles: KnowledgeArticle[];
  filteredArticles: KnowledgeArticle[];
  searchQuery: string;
  selectedArticleId: string | null;
  onSearchChange: (value: string) => void;
  onSelectArticle: (article: KnowledgeArticle) => void;
  onStartNewArticle: () => void;
};

export function KnowledgeArticleList({
  articles,
  filteredArticles,
  searchQuery,
  selectedArticleId,
  onSearchChange,
  onSelectArticle,
  onStartNewArticle,
}: KnowledgeArticleListProps) {
  return (
    <aside className="border-b border-slate-200 bg-slate-50/80 lg:border-r lg:border-b-0">
      <div className="border-b border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-950">Материалы</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {articles.length} материалов для AI-ответов
            </p>
          </div>
          <button
            type="button"
            onClick={onStartNewArticle}
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
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Поиск по вопросу"
            className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-950"
          />
        </label>
      </div>

      <div className="space-y-2 p-3">
        {/* Список слева сразу показывает похожие вопросы по введенному тексту. */}
        {filteredArticles.length > 0 ? (
          filteredArticles.map((article) => (
            <button
              key={article.id}
              type="button"
              onClick={() => onSelectArticle(article)}
              className={`w-full rounded-md border p-3 text-left transition-colors ${
                selectedArticleId === article.id
                  ? "border-slate-950 bg-white shadow-sm"
                  : "border-slate-200 bg-white/75 hover:border-slate-300 hover:bg-white"
              }`}
            >
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-500">
                {article.knowledge_categories?.name ?? "Без категории"}
              </span>
              <h3 className="mt-2 line-clamp-2 text-sm font-semibold leading-5 text-slate-950">
                {article.title}
              </h3>
              <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                {article.content}
              </p>
            </button>
          ))
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
  );
}
