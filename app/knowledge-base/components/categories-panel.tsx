"use client";

import type { FormEvent } from "react";

import type { KnowledgeCategory } from "../types";

type KnowledgeCategoriesPanelProps = {
  categories: KnowledgeCategory[];
  categoryErrorMessage: string | null;
  categoryName: string;
  categorySuccessMessage: string | null;
  isDeletingCategory: boolean;
  isSavingCategory: boolean;
  selectedCategoryEditId: string | null;
  onCategoryNameChange: (value: string) => void;
  onDeleteCategory: () => void;
  onSelectCategory: (category: KnowledgeCategory) => void;
  onStartNewCategory: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function KnowledgeCategoriesPanel({
  categories,
  categoryErrorMessage,
  categoryName,
  categorySuccessMessage,
  isDeletingCategory,
  isSavingCategory,
  selectedCategoryEditId,
  onCategoryNameChange,
  onDeleteCategory,
  onSelectCategory,
  onStartNewCategory,
  onSubmit,
}: KnowledgeCategoriesPanelProps) {
  return (
    <form onSubmit={onSubmit}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-950">Категории</h2>
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
              onClick={() => onSelectCategory(category)}
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
          onChange={(event) => onCategoryNameChange(event.target.value)}
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
        disabled={isSavingCategory}
        className="mt-3 h-9 w-full rounded-md bg-slate-950 px-3 text-xs font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
      >
        {isSavingCategory
          ? "Сохранение"
          : selectedCategoryEditId
            ? "Переименовать"
            : "Добавить категорию"}
      </button>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onStartNewCategory}
          className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
        >
          Новая
        </button>
        <button
          type="button"
          onClick={onDeleteCategory}
          disabled={
            !selectedCategoryEditId || isDeletingCategory || isSavingCategory
          }
          className="h-8 rounded-md border border-red-200 bg-white px-2 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
        >
          {isDeletingCategory ? "Удаление" : "Удалить"}
        </button>
      </div>
    </form>
  );
}
