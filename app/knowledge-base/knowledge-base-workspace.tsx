"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import {
  createKnowledgeArticleAction,
  createKnowledgeCategoryAction,
  deleteKnowledgeArticleAction,
  deleteKnowledgeCategoryAction,
  updateKnowledgeArticleAction,
  updateKnowledgeCategoryAction,
} from "./actions";
import type { KnowledgeArticle, KnowledgeCategory } from "./types";

type KnowledgeBaseWorkspaceProps = {
  articles: KnowledgeArticle[];
  categories: KnowledgeCategory[];
  qualityChecks: string[];
};

// Интерактивная часть базы знаний: поиск, список карточек и форма сохранения.
export function KnowledgeBaseWorkspace({
  articles,
  categories,
  qualityChecks,
}: KnowledgeBaseWorkspaceProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(
    articles[0]?.id ?? null,
  );
  const selectedArticle =
    articles.find((article) => article.id === selectedArticleId) ?? null;
  const [question, setQuestion] = useState(selectedArticle?.question ?? "");
  const [answer, setAnswer] = useState(selectedArticle?.answer ?? "");
  const [categoryId, setCategoryId] = useState(
    selectedArticle?.categoryId ?? categories[0]?.id ?? "",
  );
  const [selectedCategoryEditId, setSelectedCategoryEditId] = useState<
    string | null
  >(null);
  const [categoryName, setCategoryName] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [categoryErrorMessage, setCategoryErrorMessage] = useState<
    string | null
  >(null);
  const [categorySuccessMessage, setCategorySuccessMessage] = useState<
    string | null
  >(null);
  const [isSaving, startSaving] = useTransition();
  const [isDeletingArticle, startDeletingArticle] = useTransition();
  const [isCreatingCategory, startCreatingCategory] = useTransition();
  const [isDeletingCategory, startDeletingCategory] = useTransition();
  const normalizedQuery = searchQuery.trim().toLowerCase();
  // Если после router.refresh() с сервера пришел новый список категорий,
  // а выбранного id в нем уже нет, безопасно подставляем первую доступную категорию.
  const selectedCategoryId = categories.some(
    (category) => category.id === categoryId,
  )
    ? categoryId
    : (categories[0]?.id ?? "");

  // Небольшие списки фильтруем на клиенте; при росте базы поиск можно перенести в Supabase.
  const filteredArticles = useMemo(() => {
    if (!normalizedQuery) {
      return articles;
    }

    return articles.filter((article) =>
      `${article.question} ${article.answer} ${article.tag}`
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [articles, normalizedQuery]);

  function showArticle(article: KnowledgeArticle) {
    // При клике по карточке переносим ее данные в форму, чтобы менеджер видел содержимое.
    setSelectedArticleId(article.id);
    setQuestion(article.question);
    setAnswer(article.answer);
    setCategoryId(article.categoryId);
    setErrorMessage(null);
    setSuccessMessage(null);
  }

  function startNewArticle() {
    // Очищаем форму для новой карточки; сохранение дальше пойдет через Server Action.
    setSelectedArticleId(null);
    setQuestion("");
    setAnswer("");
    setCategoryId(categories[0]?.id ?? "");
    setErrorMessage(null);
    setSuccessMessage(null);
  }

  function startNewCategory() {
    // Переключаем правую форму обратно в режим создания категории.
    setSelectedCategoryEditId(null);
    setCategoryName("");
    setCategoryErrorMessage(null);
    setCategorySuccessMessage(null);
  }

  function showCategory(category: KnowledgeCategory) {
    // Подставляем выбранную категорию в форму, чтобы менеджер мог переименовать ее.
    setSelectedCategoryEditId(category.id);
    setCategoryName(category.name);
    setCategoryErrorMessage(null);
    setCategorySuccessMessage(null);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSaving || isDeletingArticle) {
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);

    startSaving(async () => {
      try {
        const isEditingArticle = Boolean(selectedArticleId);

        // Если карточка выбрана, отправляем PATCH в /knowledge-base.
        // Если карточка новая, отправляем POST в /knowledge-base.
        const result = selectedArticleId
          ? await updateKnowledgeArticleAction({
              id: selectedArticleId,
              question,
              answer,
              categoryId: selectedCategoryId,
            })
          : await createKnowledgeArticleAction({
              question,
              answer,
              categoryId: selectedCategoryId,
            });

        if (!result.ok) {
          setErrorMessage(result.error);
          return;
        }

        if (!isEditingArticle) {
          setQuestion("");
          setAnswer("");
          setSelectedArticleId(null);
        }

        setSuccessMessage(
          isEditingArticle
            ? "Карточка обновлена в базе знаний."
            : "Карточка сохранена в базе знаний.",
        );
        // После успешного ответа заново запрашиваем серверные данные страницы,
        // чтобы новая карточка появилась в списке слева.
        router.refresh();
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Не удалось сохранить карточку.",
        );
      }
    });
  }

  function handleDeleteArticle() {
    if (!selectedArticleId || isDeletingArticle || isSaving) {
      return;
    }

    const shouldDelete = window.confirm(
      "Удалить карточку из активной базы знаний?",
    );

    if (!shouldDelete) {
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);

    startDeletingArticle(async () => {
      try {
        // DELETE /knowledge-base делает мягкое удаление: backend выставляет is_active = false.
        const result = await deleteKnowledgeArticleAction({
          id: selectedArticleId,
        });

        if (!result.ok) {
          setErrorMessage(result.error);
          return;
        }

        setSelectedArticleId(null);
        setQuestion("");
        setAnswer("");
        setSuccessMessage("Карточка удалена из активной базы знаний.");
        router.refresh();
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Не удалось удалить карточку.",
        );
      }
    });
  }

  function handleCategorySubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isCreatingCategory || isDeletingCategory) {
      return;
    }

    setCategoryErrorMessage(null);
    setCategorySuccessMessage(null);

    startCreatingCategory(async () => {
      try {
        const isEditingCategory = Boolean(selectedCategoryEditId);

        // Если категория выбрана, отправляем PATCH в /knowledge-categories.
        // Если форма новая, отправляем POST в /knowledge-categories.
        const result = selectedCategoryEditId
          ? await updateKnowledgeCategoryAction({
              id: selectedCategoryEditId,
              name: categoryName,
            })
          : await createKnowledgeCategoryAction({
              name: categoryName,
            });

        if (!result.ok) {
          setCategoryErrorMessage(result.error);
          return;
        }

        setCategoryName("");
        setSelectedCategoryEditId(null);
        setCategorySuccessMessage(
          isEditingCategory
            ? "Категория переименована."
            : "Категория добавлена в базу знаний.",
        );
        // Обновляем props с сервера, чтобы новая категория появилась в счетчике и select.
        router.refresh();
      } catch (error) {
        setCategoryErrorMessage(
          error instanceof Error
            ? error.message
            : "Не удалось добавить категорию.",
        );
      }
    });
  }

  function handleDeleteCategory() {
    if (!selectedCategoryEditId || isDeletingCategory || isCreatingCategory) {
      return;
    }

    const shouldDelete = window.confirm(
      "Удалить категорию из активного списка?",
    );

    if (!shouldDelete) {
      return;
    }

    setCategoryErrorMessage(null);
    setCategorySuccessMessage(null);

    startDeletingCategory(async () => {
      try {
        // DELETE /knowledge-categories делает мягкое удаление категории через backend.
        const result = await deleteKnowledgeCategoryAction({
          id: selectedCategoryEditId,
        });

        if (!result.ok) {
          setCategoryErrorMessage(result.error);
          return;
        }

        setSelectedCategoryEditId(null);
        setCategoryName("");
        setCategorySuccessMessage("Категория удалена из активного списка.");
        router.refresh();
      } catch (error) {
        setCategoryErrorMessage(
          error instanceof Error
            ? error.message
            : "Не удалось удалить категорию.",
        );
      }
    });
  }

  return (
    <section className="min-h-[calc(100vh-5.75rem)] rounded-md border border-slate-200 bg-white shadow-[0_12px_32px_rgba(15,23,42,0.07)]">
      <div className="grid min-h-[calc(100vh-5.85rem)] grid-cols-1 overflow-hidden lg:grid-cols-[320px_minmax(0,1fr)]">
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
                onClick={startNewArticle}
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
              filteredArticles.map((article) => (
                <button
                  key={article.id}
                  type="button"
                  onClick={() => showArticle(article)}
                  className={`w-full rounded-md border p-3 text-left transition-colors ${
                    selectedArticleId === article.id
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

        <div className="grid min-h-0 grid-cols-1 bg-[#f7f9fb] xl:grid-cols-[minmax(0,1fr)_300px]">
          {/* Центральная форма редактирует локально и создает новую карточку через Edge Function. */}
          <section className="min-w-0 px-4 py-4">
            <form action="#" onSubmit={handleSubmit}>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-400">
                    Карточка знания
                  </p>
                  <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                    Вопрос и ответ для будущего AI
                  </h2>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {selectedArticleId ? (
                    <button
                      type="button"
                      onClick={handleDeleteArticle}
                      disabled={isDeletingArticle || isSaving}
                      className="h-9 rounded-md border border-red-200 bg-white px-3 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                    >
                      {isDeletingArticle ? "Удаление" : "Удалить"}
                    </button>
                  ) : null}
                  <button
                    type="submit"
                    disabled={isSaving || categories.length === 0}
                    className="h-9 rounded-md bg-slate-950 px-3 text-xs font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
                  >
                    {isSaving
                      ? "Сохранение"
                      : selectedArticleId
                        ? "Обновить"
                        : "Сохранить"}
                  </button>
                </div>
              </div>

              {errorMessage ? (
                <p className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                  {errorMessage}
                </p>
              ) : null}
              {successMessage ? (
                <p className="mb-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
                  {successMessage}
                </p>
              ) : null}
              {categories.length === 0 ? (
                <p className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                  Сначала добавьте категорию для базы знаний.
                </p>
              ) : null}

              <div className="grid gap-3">
                <label className="grid gap-1.5">
                  <span className="text-xs font-semibold text-slate-500">
                    Вопрос клиента
                  </span>
                  <textarea
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                    placeholder="Например: как перенести консультацию?"
                    className="min-h-24 resize-none rounded-md border border-slate-200 bg-white px-3 py-2 text-sm leading-6 text-slate-900 outline-none transition-colors focus:border-slate-950"
                  />
                </label>

                <label className="grid gap-1.5">
                  <span className="text-xs font-semibold text-slate-500">
                    Ответ
                  </span>
                  <textarea
                    value={answer}
                    onChange={(event) => setAnswer(event.target.value)}
                    placeholder="Короткий точный ответ, который можно использовать для AI."
                    className="min-h-44 resize-none rounded-md border border-slate-200 bg-white px-3 py-2 text-sm leading-6 text-slate-900 outline-none transition-colors focus:border-slate-950"
                  />
                </label>

                <div className="max-w-md">
                  <label className="grid gap-1.5">
                    <span className="text-xs font-semibold text-slate-500">
                      Категория
                    </span>
                    <select
                      value={selectedCategoryId}
                      onChange={(event) => setCategoryId(event.target.value)}
                      disabled={categories.length === 0}
                      className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-slate-950 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
            </form>
          </section>

          {/* Правый блок фиксирует критерии качества перед подключением AI. */}
          <aside className="border-t border-slate-200 bg-white px-4 py-4 xl:border-t-0 xl:border-l">
            <form onSubmit={handleCategorySubmit}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-950">
                    Категории
                  </h2>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Добавьте новую категорию или выберите существующую для
                    переименования.
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-500">
                  {categories.length}
                </span>
              </div>

              <div className="mt-3 max-h-40 space-y-1 overflow-y-auto rounded-md border border-slate-200 bg-slate-50 p-1">
                {categories.length > 0 ? (
                  categories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => showCategory(category)}
                      className={`w-full rounded px-2 py-1.5 text-left text-xs font-medium transition-colors ${
                        selectedCategoryEditId === category.id
                          ? "bg-slate-950 text-white"
                          : "text-slate-700 hover:bg-white"
                      }`}
                    >
                      {category.name}
                    </button>
                  ))
                ) : (
                  <p className="px-2 py-3 text-center text-xs text-slate-500">
                    Категорий пока нет
                  </p>
                )}
              </div>

              <label className="mt-3 grid gap-1.5">
                <span className="text-xs font-semibold text-slate-500">
                  {selectedCategoryEditId
                    ? "Новое название"
                    : "Название новой категории"}
                </span>
                <input
                  type="text"
                  value={categoryName}
                  onChange={(event) => setCategoryName(event.target.value)}
                  placeholder="Например: Оплата"
                  className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-950"
                />
              </label>

              {categoryErrorMessage ? (
                <p className="mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                  {categoryErrorMessage}
                </p>
              ) : null}
              {categorySuccessMessage ? (
                <p className="mt-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
                  {categorySuccessMessage}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isCreatingCategory}
                className="mt-3 h-9 w-full rounded-md bg-slate-950 px-3 text-xs font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
              >
                {isCreatingCategory
                  ? "Сохранение"
                  : selectedCategoryEditId
                    ? "Переименовать"
                    : "Добавить категорию"}
              </button>

              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={startNewCategory}
                  className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Новая
                </button>
                <button
                  type="button"
                  onClick={handleDeleteCategory}
                  disabled={
                    !selectedCategoryEditId ||
                    isDeletingCategory ||
                    isCreatingCategory
                  }
                  className="h-8 rounded-md border border-red-200 bg-white px-2 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                >
                  {isDeletingCategory ? "Удаление" : "Удалить"}
                </button>
              </div>
            </form>

            <div className="mt-5 border-t border-slate-200 pt-4">
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
                Новые карточки и категории сохраняются через Supabase Edge
                Function.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
