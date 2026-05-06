import { Header } from "../messages/header";
import { getAuthorizedManager } from "../messages/queries";
import { KnowledgeBaseWorkspace } from "./knowledge-base-workspace";

// Временные карточки нужны только для макета до подключения таблицы базы знаний.
const draftArticles = [
  {
    id: "kb-1",
    question: "Как записаться на консультацию?",
    answer:
      "Менеджер уточняет дату, время и контакт клиента, затем подтверждает запись в рабочем календаре.",
    tag: "Продажи",
  },
  {
    id: "kb-2",
    question: "Что делать, если клиент не получил ссылку?",
    answer:
      "Проверить корректность контакта, повторно отправить ссылку и зафиксировать действие в переписке.",
    tag: "Поддержка",
  },
  {
    id: "kb-3",
    question: "Как передать сложный вопрос другому менеджеру?",
    answer:
      "Снять назначение с клиента или назначить диалог на менеджера, который отвечает за нужное направление.",
    tag: "Процессы",
  },
];

// Чеклист показывает, какие требования будут важны для будущих AI-ответов.
const qualityChecks = [
  "Вопрос сформулирован так, как пишет клиент",
  "Ответ короткий и без лишних деталей",
  "Есть понятное действие для менеджера или AI",
  "Информация готова к проверке перед публикацией",
];

// Серверная страница защищает раздел и передает статичные заготовки в client workspace.
export default async function KnowledgeBasePage() {
  const manager = await getAuthorizedManager();
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
          articles={draftArticles}
          qualityChecks={qualityChecks}
        />
      </div>
    </main>
  );
}
