# Неделя 3 — Telegram Bot и авторизация в Next.js
https://margot-ai-assistant-bot-admin-panel.vercel.app/

К концу недели должно быть готово:

- авторизация в Next.js через Supabase Auth
- восстановление пароля через Supabase Auth
- защищенная страница `/messages`
- header с email авторизованного пользователя
- logout-flow с очисткой Supabase auth session cookies

---

## Повторяем архитектуру

Бизнес-логика может находиться в разных слоях:

- `Server Actions` в Next.js — API-слой внутри приложения.
- Supabase Edge Functions — отдельные HTTP-эндпоинты рядом с Supabase.
- Отдельный backend-сервис, например NestJS.

Главная идея: UI не должен напрямую содержать сложную бизнес-логику. UI вызывает действие, а действие уже работает с Supabase, базой данных, внешним API или другим сервисом.

---

## Повторяем Supabase

Supabase поднимает PostgreSQL базу данных и автоматически создает REST API для таблиц. Это позволяет работать с данными через Supabase API, а не ходить напрямую в базу из клиентского кода.

### Изучаем и повторяем Таблицы и миграции

Таблицу правильно создавать через миграцию.

Миграция — это SQL-скрипт, который изменяет схему базы данных: создает таблицы, добавляет поля, индексы, политики доступа и так далее.

После создания миграции ее можно применить командой:

```bash
supabase db push
```

### Вспоминаем CRUD и RPC

Supabase предоставляет CRUD API для таблиц:

- `create`
- `read`
- `update`
- `delete`

Также Supabase поддерживает RPC — `Remote Procedure Call`. Это способ вызвать SQL-функцию в базе данных как удаленную процедуру.

---

## Вспоминаем: Telegram Bot как отдельный backend

Telegram bot — это отдельная backend-программа. Она принимает HTTP-запросы и отправляет HTTP-ответы.

В нашем случае bot реализован через:

- Supabase Edge Function
- Supabase как BaaS
- Telegram webhook

Telegram уведомляет наш endpoint, что в боте произошло событие. Edge Function обрабатывает запрос, выполняет бизнес-логику и при необходимости записывает данные в Supabase.

Каждая Edge Function — это отдельный endpoint, который обрабатывает отдельный тип запроса. Edge Functions в Supabase выполняются в Deno.

---

## Обсуждаем Как взаимодействуют сервисы

В проекте есть несколько частей:

- Telegram отправляет webhook в Supabase Edge Function.
- Edge Function обрабатывает событие от Telegram.
- Edge Function сохраняет сообщения в Supabase.
- Next.js приложение читает сообщения из Supabase и показывает их в админке.
- Next.js использует Supabase Auth для авторизации пользователя.

---

## Знакомимся с pgAdmin

Мы знакомимся с pgAdmin, чтобы смотреть базу данных напрямую.

Как подключиться:

1. Открыть Supabase project.
2. Перейти в `Project Settings`.
3. Найти `Database`.
4. Открыть блок `Connection string`.
5. Выбрать `Direct connection` или `Session pooler`.
6. Ввести данные подключения в pgAdmin.

В pgAdmin можно найти раздел `Tables`, посмотреть таблицы, поля, типы данных и данные внутри таблиц.

---

## Next.js: авторизация

Авторизация настраивается через Supabase Auth:

```text
Supabase Dashboard -> Authentication
```

Пока пользователей добавляем вручную через Supabase:

```text
Authentication -> Users -> Add user
```

Для теста можно включить `Auto Confirm User`.

Тестовый аккаунт:

```text
email: test@test.com
password: test
```

---

## Supabase clients в Next.js

В проекте есть два server-side клиента Supabase.

Файл:

```text
lib/supabase/server.ts
```

### Auth client

```ts
createSupabaseServerClient()
```

Этот клиент учитывает Supabase Auth cookies. Он нужен для:

- login
- logout
- `supabase.auth.getUser()`
- `supabase.auth.updateUser()`
- проверки текущей user session

Так Next.js понимает, какой пользователь сейчас авторизован.

### Admin client

```ts
createSupabaseAdminClient()
```

Этот клиент использует `SB_SECRET` и не учитывает cookies пользователя.

Он нужен для server-side admin-запросов, например для чтения сообщений на странице `/messages`.

Почему не один универсальный клиент:

- auth-клиент работает от имени текущего пользователя и зависит от cookies
- admin-клиент работает от имени сервера и не зависит от пользовательской сессии

Если читать `/messages` через auth-клиент, Supabase RLS может отфильтровать строки по текущему пользователю, и страница окажется пустой.

---

## Login page

Страница:

```text
app/login/page.tsx
```

Форма:

```text
app/login/login-form.tsx
```

Server Action:

```text
app/login/actions.ts
```

### Prompt для ИИ: создать login page

```text
Создать страницу логинизации `/login`:
- добавить форму авторизации
- два поля:
  - email
  - password
- кнопка "Login"
- форма отправляется через Server Action
- создать server action `loginAction`
- внутри server action пока сделать заглушку:
  - принять email и password
  - вывести значения в console.log
```

Чтобы дебажить backend-часть Next.js, можно добавить inspect-флаг в dev-script:

```json
{
  "scripts": {
    "dev": "next dev --inspect"
  }
}
```

После этого перезапускаем приложение и смотрим, как отрабатывает Server Action.

---

## Login logic через Supabase Auth

### Prompt для ИИ

```text
Реализовать авторизацию пользователя через Supabase Auth:
- создать форму логина (email + password)
- при submit вызвать supabase.auth.signInWithPassword()
- при успешной авторизации сделать redirect на страницу `/messages`
- при ошибке показать сообщение пользователю под кнопкой "Войти"
```

В Server Action вызываем:

```ts
supabase.auth.signInWithPassword({
  email,
  password,
});
```

Если авторизация успешна:

```ts
redirect("/messages");
```

Если ошибка:

```ts
return {
  error: "Неверный логин или пароль.",
};
```

В форме используется `useActionState`, чтобы показать ошибку под кнопкой.

---

## Автоматические redirects

### `/login`

Если пользователь уже авторизован, страницу логина показывать не нужно.

На странице `/login` server-side вызываем:

```ts
const { data } = await supabase.auth.getUser();
```

Если пользователь есть:

```ts
redirect("/messages");
```

Если пользователя нет, показываем login form.

### `/messages`

На странице `/messages` тоже выполняется server-side проверка:

```ts
supabase.auth.getUser();
```

Если пользователь НЕ авторизован:

```ts
redirect("/login");
```

Если пользователь авторизован, показываем страницу сообщений.

### Prompt для ИИ

```text
Реализовать автоматический редирект пользователя в зависимости от статуса авторизации:
На странице `/login`:
- получить пользователя через:
supabase.auth.getUser()
если пользователь авторизован:
- выполнить redirect на страницу `/messages`
если пользователь НЕ авторизован:
- оставить пользователя на странице `/login`
На странице `/messages`:
- получить пользователя через:
supabase.auth.getUser()
если пользователь НЕ авторизован:
- выполнить redirect на страницу `/login`
если пользователь авторизован:
- показать страницу `/messages`
```

---

## Восстановление пароля

Мы реализовали flow восстановления пароля через Supabase Auth.

Форма восстановления на странице login:

```text
app/login/password-recovery-form.tsx
```

Server Action для отправки письма:

```text
app/login/password-recovery-actions.ts
```

Страница обновления пароля:

```text
app/reset-password/page.tsx
```

Форма обновления пароля:

```text
app/reset-password/reset-password-form.tsx
```

Server Action обновления пароля:

```text
app/reset-password/actions.ts
```

### Prompt для ИИ

```text
Реализовать восстановление пароля через Supabase Auth:
1. Добавить ссылку "Забыли пароль?" на странице `/login`
2. При нажатии показать форму ввода email
3. При отправке вызвать:
supabase.auth.resetPasswordForEmail(email, {
redirectTo: `${window.location.origin}/reset-password`
})
4. Создать страницу `/reset-password`
5. Добавить форму:
   - новый пароль
   - повтор пароля
   - кнопка "Обновить пароль"
6. Проверить:
   - заполнены ли оба поля
   - совпадают ли пароли
   - соответствует ли пароль минимальной длине
7. При отправке вызвать:
supabase.auth.updateUser({ password: newPassword })
8. После успешного обновления выполнить redirect на `/messages`
9. При ошибке показать сообщение пользователю
```

### Как реализовано в проекте

Мы не стали создавать browser Supabase client и не стали добавлять `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

Вместо этого отправка письма выполняется через Server Action.

На сервере origin берется из headers:

```ts
const headersList = await headers();
const origin = headersList.get("origin");
```

Затем вызывается:

```ts
supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${origin}/reset-password`,
});
```

На странице `/reset-password` проверяем:

- заполнены ли оба поля
- совпадают ли пароли
- пароль не короче минимальной длины

После этого вызываем:

```ts
supabase.auth.updateUser({
  password,
});
```

После успешного обновления:

```ts
redirect("/messages");
```

При ошибке показываем сообщение пользователю.

---

## Header на странице messages

Компонент:

```text
app/messages/header.tsx
```

В header отображаем:

- заголовок страницы
- email авторизованного пользователя
- кнопку `Выйти`

Email получаем server-side:

```ts
supabase.auth.getUser();
```

Если пользователь авторизован, показываем email.

Если пользователь не авторизован, делаем:

```ts
redirect("/login");
```

### Prompt для ИИ

```text
Добавить header на страницу `/messages`:
- создать Header компонент
- отобразить email авторизованного пользователя
- получить пользователя через:
supabase.auth.getUser()
Если пользователь авторизован:
- показать его email в header
Если пользователь НЕ авторизован:
- сделать redirect на страницу `/login`
Проверку авторизации выполнять server-side через Supabase Auth cookies.
```

---

## Logout

Logout реализован через Server Action:

```text
app/messages/actions.ts
```

В header рядом с email есть кнопка:

```text
Выйти
```

При нажатии вызывается:

```ts
supabase.auth.signOut();
```

После logout Supabase auth session cookies удаляются, и пользователь перенаправляется на:

```ts
redirect("/login");
```

После logout доступ к `/messages` запрещен, потому что страница снова проверяет:

```ts
supabase.auth.getUser();
```

Если сессии нет, выполняется redirect на `/login`.

### Prompt для ИИ

```text
Добавить кнопку "Выйти" в Header:
- рядом с email пользователя добавить кнопку "Выйти"
- при нажатии вызвать:
supabase.auth.signOut()
- удалить auth session cookies Supabase
- выполнить redirect на страницу `/login`
- запретить доступ к странице `/messages` после logout
```

---

## Тестовый аккаунт на login page

На странице `/login` добавлен компактный информационный блок с тестовым аккаунтом:

```text
Email: test@test.com
Password: test
```

Это нужно, чтобы коллеги или проверяющие могли быстро зайти в админку и посмотреть страницу сообщений.

---

## Итог

В результате в Next.js админке есть:

- логин через Supabase Auth
- server-side проверка авторизации через Supabase Auth cookies
- redirect с `/login` на `/messages`, если пользователь уже авторизован
- redirect с `/messages` на `/login`, если пользователь не авторизован
- восстановление пароля через Supabase Auth
- обновление пароля через `/reset-password`
- header с email пользователя
- logout с очисткой auth session cookies
- защищенный доступ к странице `/messages`
