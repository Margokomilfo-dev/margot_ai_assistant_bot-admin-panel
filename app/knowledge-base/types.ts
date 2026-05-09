export type KnowledgeArticle = {
  id: string;
  question: string;
  answer: string;
  categoryId: string;
  tag: string;
};

export type KnowledgeCategory = {
  id: string;
  name: string;
  slug: string;
};

export type KnowledgeActionResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      error: string;
    };

export type CreateKnowledgeArticleResult = KnowledgeActionResult;
export type CreateKnowledgeCategoryResult = KnowledgeActionResult;
export type UpdateKnowledgeArticleResult = KnowledgeActionResult;
export type DeleteKnowledgeArticleResult = KnowledgeActionResult;
export type UpdateKnowledgeCategoryResult = KnowledgeActionResult;
export type DeleteKnowledgeCategoryResult = KnowledgeActionResult;
