// Текст сервисного сообщения клиенту при назначении менеджера.
// Отправляется через тот же manager-reply Edge Function, чтобы Telegram-логика была на backend.
export function buildManagerAssignedMessage(manager: {
  name: string;
  surname: string;
  position: string;
}) {
  return [
    "Здравствуйте! 👋",
    "",
    `На ваш вопрос вскоре ответит ${manager.name} ${manager.surname}. Спасибо за ваше терпение! 💫`,
  ].join("\n");
}
