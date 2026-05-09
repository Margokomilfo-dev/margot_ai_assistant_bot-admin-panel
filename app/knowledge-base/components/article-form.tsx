"use client";

import type { FormEvent } from "react";

import type { KnowledgeCategory } from "../types";

type KnowledgeArticleFormProps = {
  answer: string;
  categories: KnowledgeCategory[];
  errorMessage: string | null;
  isDeleting: boolean;
  isSaving: boolean;
  question: string;
  selectedArticleId: string | null;
  selectedCategoryId: string;
  successMessage: string | null;
  onAnswerChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onDelete: () => void;
  onQuestionChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function KnowledgeArticleForm({
  answer,
  categories,
  errorMessage,
  isDeleting,
  isSaving,
  question,
  selectedArticleId,
  selectedCategoryId,
  successMessage,
  onAnswerChange,
  onCategoryChange,
  onDelete,
  onQuestionChange,
  onSubmit,
}: KnowledgeArticleFormProps) {
  return (
    <section className="min-w-0 px-4 py-4">
      <form action="#" onSubmit={onSubmit}>
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
                onClick={onDelete}
                disabled={isDeleting || isSaving}
                className="h-9 rounded-md border border-red-200 bg-white px-3 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
              >
                {isDeleting ? "Удаление" : "Удалить"}
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
              onChange={(event) => onQuestionChange(event.target.value)}
              placeholder="Например: как перенести консультацию?"
              className="min-h-24 resize-none rounded-md border border-slate-200 bg-white px-3 py-2 text-sm leading-6 text-slate-900 outline-none transition-colors focus:border-slate-950"
            />
          </label>

          <label className="grid gap-1.5">
            <span className="text-xs font-semibold text-slate-500">Ответ</span>
            <textarea
              value={answer}
              onChange={(event) => onAnswerChange(event.target.value)}
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
                onChange={(event) => onCategoryChange(event.target.value)}
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
  );
}
