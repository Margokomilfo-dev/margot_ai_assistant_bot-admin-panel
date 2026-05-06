type DisplayableClient = {
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  user_id?: number;
  telegram_user_id?: number;
};

// Имя клиента собирается из доступных Telegram-полей с понятным fallback.
export function getDisplayName(person: DisplayableClient) {
  const fullName = [person.first_name, person.last_name]
    .filter(Boolean)
    .join(" ");

  if (fullName) {
    return fullName;
  }

  if (person.username) {
    return `@${person.username}`;
  }

  return `User ${person.user_id ?? person.telegram_user_id}`;
}

// Инициалы используются в аватарах списка клиентов и шапки диалога.
export function getInitials(person: DisplayableClient) {
  const firstInitial = person.first_name?.trim().charAt(0);
  const lastInitial = person.last_name?.trim().charAt(0);

  if (firstInitial || lastInitial) {
    return `${firstInitial ?? ""}${lastInitial ?? ""}`.toUpperCase();
  }

  return getDisplayName(person).slice(0, 2).toUpperCase();
}

// Форматтеры ниже держат единый вид дат в списке клиентов и внутри чата.
export function formatDate(value: string | null) {
  if (!value) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatMessageDay(value: string | null) {
  if (!value) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function formatMessageTime(value: string | null) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatClientLastMessage(value: string | null) {
  if (!value) {
    return "No messages";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

// Ключ дня нужен для группировки сообщений под одним разделителем даты.
export function getMessageDayKey(value: string | null) {
  if (!value) {
    return "unknown";
  }

  return new Date(value).toISOString().slice(0, 10);
}
