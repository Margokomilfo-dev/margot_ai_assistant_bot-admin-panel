"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useMemo, useState, useTransition } from "react";

import {
  createKnowledgeArticleAction,
  createKnowledgeCategoryAction,
  deleteKnowledgeArticleAction,
  deleteKnowledgeCategoryAction,
  updateKnowledgeArticleAction,
  updateKnowledgeCategoryAction,
} from "../actions";
import type {
  KnowledgeArticle,
  KnowledgeCategory,
} from "../knowledge-base-workspace";

type UseKnowledgeBaseWorkspaceInput = {
  articles: KnowledgeArticle[];
  categories: KnowledgeCategory[];
};

export function useKnowledgeBaseWorkspace({
  articles,
  categories,
}: UseKnowledgeBaseWorkspaceInput) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(
    articles[0]?.id ?? null,
  );
  const selectedArticle =
    articles.find((article) => article.id === selectedArticleId) ?? null;
  const [question, setQuestion] = useState(selectedArticle?.title ?? "");
  const [answer, setAnswer] = useState(selectedArticle?.content ?? "");
  const [categoryId, setCategoryId] = useState(
    selectedArticle?.category_id ?? categories[0]?.id ?? "",
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
  const [isSavingCategory, startSavingCategory] = useTransition();
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
      `${article.title} ${article.content} ${article.knowledge_categories?.name ?? ""}`
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [articles, normalizedQuery]);

  function showArticle(article: KnowledgeArticle) {
    // При клике по карточке переносим ее данные в форму, чтобы менеджер видел содержимое.
    setSelectedArticleId(article.id);
    setQuestion(article.title);
    setAnswer(article.content);
    setCategoryId(article.category_id);
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

  function saveArticle(event: FormEvent<HTMLFormElement>) {
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
              title: question,
              content: answer,
              category_id: selectedCategoryId,
            })
          : await createKnowledgeArticleAction({
              title: question,
              content: answer,
              category_id: selectedCategoryId,
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

  function deleteArticle() {
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

  function saveCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSavingCategory || isDeletingCategory) {
      return;
    }

    setCategoryErrorMessage(null);
    setCategorySuccessMessage(null);

    startSavingCategory(async () => {
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

  function deleteCategory() {
    if (!selectedCategoryEditId || isDeletingCategory || isSavingCategory) {
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

  return {
    articleForm: {
      answer,
      errorMessage,
      isDeleting: isDeletingArticle,
      isSaving,
      question,
      selectedArticleId,
      selectedCategoryId,
      successMessage,
      onAnswerChange: setAnswer,
      onCategoryChange: setCategoryId,
      onDelete: deleteArticle,
      onQuestionChange: setQuestion,
      onSubmit: saveArticle,
    },
    articleList: {
      filteredArticles,
      searchQuery,
      selectedArticleId,
      onSearchChange: setSearchQuery,
      onSelectArticle: showArticle,
      onStartNewArticle: startNewArticle,
    },
    categoryPanel: {
      categoryErrorMessage,
      categoryName,
      categorySuccessMessage,
      isDeletingCategory,
      isSavingCategory,
      selectedCategoryEditId,
      onCategoryNameChange: setCategoryName,
      onDeleteCategory: deleteCategory,
      onSelectCategory: showCategory,
      onStartNewCategory: startNewCategory,
      onSubmit: saveCategory,
    },
  };
}
