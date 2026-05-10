export type ChatbotActionResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      error: string;
    };
