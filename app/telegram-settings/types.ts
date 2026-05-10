export type TelegramActionResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      error: string;
    };
