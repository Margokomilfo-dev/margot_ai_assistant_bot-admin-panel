import { Header } from "../messages/header";
import { getAuthorizedManager } from "../messages/queries";
import { KnowledgeBaseWorkspace } from "./knowledge-base-workspace";
import { getKnowledgeArticles, getKnowledgeCategories } from "./queries";

// Чеклист показывает, какие требования будут важны для будущих AI-ответов.
const qualityChecks = [
  "Вопрос сформулирован так, как пишет клиент",
  "Ответ короткий и без лишних деталей",
  "Есть понятное действие для менеджера или AI",
  "Информация готова к проверке перед публикацией",
];

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
          title="Astro-Bot — База знаний"
          activeSection="knowledge-base"
          managerName={managerName}
          managerPosition={manager.position}
        />

        <KnowledgeBaseWorkspace
          articles={articles}
          categories={categories}
          qualityChecks={qualityChecks}
        />
      </div>
    </main>
  );
}
