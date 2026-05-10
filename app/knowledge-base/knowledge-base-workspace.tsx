"use client";

import { KnowledgeArticleForm } from "./components/article-form";
import { KnowledgeArticleList } from "./components/article-list";
import { KnowledgeCategoriesPanel } from "./components/categories-panel";
import { KnowledgeQualityPanel } from "./components/quality-panel";
import { useKnowledgeBaseWorkspace } from "./hooks/use-knowledge-base-workspace";
import type { getKnowledgeArticles, getKnowledgeCategories } from "./queries";

export type KnowledgeArticle = Awaited<
  ReturnType<typeof getKnowledgeArticles>
>[number];
export type KnowledgeCategory = Awaited<
  ReturnType<typeof getKnowledgeCategories>
>[number];

type KnowledgeBaseWorkspaceProps = {
  articles: KnowledgeArticle[];
  categories: KnowledgeCategory[];
  qualityChecks: string[];
};

// Координатор страницы базы знаний: собирает состояние из hook и раскладывает его по UI-компонентам.
export function KnowledgeBaseWorkspace({
  articles,
  categories,
  qualityChecks,
}: KnowledgeBaseWorkspaceProps) {
  const { articleForm, articleList, categoryPanel } =
    useKnowledgeBaseWorkspace({
      articles,
      categories,
    });

  return (
    <section className="min-h-[calc(100vh-5.75rem)] rounded-md border border-slate-200 bg-white shadow-[0_12px_32px_rgba(15,23,42,0.07)]">
      <div className="grid min-h-[calc(100vh-5.85rem)] grid-cols-1 overflow-hidden lg:grid-cols-[320px_minmax(0,1fr)]">
        <KnowledgeArticleList articles={articles} {...articleList} />

        <div className="grid min-h-0 grid-cols-1 bg-[#f7f9fb] xl:grid-cols-[minmax(0,1fr)_300px]">
          <KnowledgeArticleForm categories={categories} {...articleForm} />

          <aside className="border-t border-slate-200 bg-white px-4 py-4 xl:border-t-0 xl:border-l">
            <KnowledgeCategoriesPanel
              categories={categories}
              {...categoryPanel}
            />
            <KnowledgeQualityPanel qualityChecks={qualityChecks} />
          </aside>
        </div>
      </div>
    </section>
  );
}
