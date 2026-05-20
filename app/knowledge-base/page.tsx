import { Header } from "../messages/components/header";
import { getAuthorizedManager } from "../messages/queries";
import { KnowledgeBaseWorkspace } from "./knowledge-base-workspace";
import { getKnowledgeArticles, getKnowledgeCategories } from "./queries";

export const dynamic = "force-dynamic";

// Серверная страница защищает раздел и передает реальные материалы базы знаний.
export default async function KnowledgeBasePage() {
  const manager = await getAuthorizedManager();
  const [articles, categories] = await Promise.all([
    getKnowledgeArticles(),
    getKnowledgeCategories(),
  ]);
  const managerName = `${manager.name} ${manager.surname}`;

  return (
    <main className="min-h-screen bg-[#eef2f5] px-3 py-3 text-slate-950 sm:px-4 lg:px-5">
      <div className="mx-auto flex min-h-[calc(100vh-1.5rem)] w-full max-w-7xl flex-col">
        <Header
          title="AI-assistant — База знаний"
          activeSection="knowledge-base"
          managerName={managerName}
          managerPosition={manager.position}
        />

        <KnowledgeBaseWorkspace
          articles={articles}
          categories={categories}
        />
      </div>
    </main>
  );
}
