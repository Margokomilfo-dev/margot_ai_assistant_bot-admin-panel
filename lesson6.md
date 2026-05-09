# Lesson 6: CRUD для базы знаний и категорий

## План выполненной работы

1. Перевести создание знаний на новый CRUD endpoint `knowledge-base`.
2. Добавить редактирование существующих записей базы знаний.
3. Добавить мягкое удаление записей базы знаний.
4. Перевести создание категорий на новый CRUD endpoint `knowledge-categories`.
5. Добавить переименование категорий с пересозданием `slug` на backend.
6. Добавить мягкое удаление категорий.
7. Обновить интерфейс базы знаний: режим создания и режим редактирования.
8. Добавить русские комментарии в код, чтобы было понятно, какие запросы выполняются и зачем.
9. Проверить проект через lint и production build.
10. Зафиксировать следующий этап: автоматические ответы бота через AI на вопросы из базы знаний.

## 1. Что изменилось в архитектуре

Раньше фронт работал с отдельными endpoint'ами:

```txt
/functions/v1/knowledge-base-create
/functions/v1/knowledge-category-create
```

Теперь backend предоставляет CRUD endpoint'ы:

```txt
/functions/v1/knowledge-base
/functions/v1/knowledge-categories
```

Это удобнее, потому что один endpoint отвечает за полный набор операций:

- `POST` - создать;
- `PATCH` - обновить;
- `DELETE` - мягко удалить.

Все запросы идут через server actions в Next.js, а не напрямую из client component. Это нужно, чтобы:

- получить Supabase access token текущего менеджера на сервере;
- не дублировать логику авторизации в UI;
- централизованно обработать ошибки;
- после успешной операции вызвать `revalidatePath("/knowledge-base")`.

Основной файл:

```txt
app/knowledge-base/actions.ts
```

## 2. Общий helper для Edge Functions

В `actions.ts` добавлен общий helper:

```ts
invokeKnowledgeFunction()
```

Он принимает:

```ts
endpoint: "knowledge-base" | "knowledge-categories"
method: "POST" | "PATCH" | "DELETE"
payload: Record<string, unknown>
```

И отправляет запрос в Supabase Edge Function:

```ts
fetch(`${supabaseUrl}/functions/v1/${endpoint}`, {
  method,
  headers: {
    apikey: supabasePublishableKey,
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(payload),
})
```

Заголовок `Authorization` обязателен, потому что backend проверяет Supabase JWT и понимает, какой manager выполняет действие.

`apikey` нужен Supabase Functions для идентификации проекта.

## 3. Создание знания

Создание новой записи базы знаний теперь идет через:

```http
POST /functions/v1/knowledge-base
```

Payload:

```json
{
  "category_id": "category-uuid",
  "title": "Как подключить оплату?",
  "content": "Текст ответа для базы знаний",
  "metadata": {
    "created_by_manager_id": "manager-uuid",
    "source": "admin-panel"
  }
}
```

Frontend берет данные из формы:

- `question` -> `title`;
- `answer` -> `content`;
- выбранная категория -> `category_id`.

Backend перед сохранением генерирует embedding из `title + content`.

Это важно: если embedding не создать, будущий semantic search не сможет находить эту запись по смыслу вопроса клиента.

## 4. Обновление знания

Если менеджер выбрал существующую карточку слева и нажал `Обновить`, frontend отправляет:

```http
PATCH /functions/v1/knowledge-base
```

Payload:

```json
{
  "id": "knowledge-base-uuid",
  "category_id": "category-uuid",
  "title": "Новый заголовок",
  "content": "Новый текст ответа"
}
```

Backend сам проверяет, изменились ли `title` или `content`.

Если текст изменился, backend пересоздает embedding. Это нужно, чтобы AI-поиск работал по актуальному содержимому, а не по старой версии ответа.

Фронт не генерирует embedding и не вызывает OpenAI напрямую.

## 5. Удаление знания

Удаление записи базы знаний идет через:

```http
DELETE /functions/v1/knowledge-base
```

Payload:

```json
{
  "id": "knowledge-base-uuid"
}
```

Удаление мягкое: backend выставляет:

```txt
is_active = false
```

Запись остается в базе для истории и возможного восстановления, но больше не должна участвовать в поиске и не показывается в активном списке.

На frontend после удаления:

- очищается выбранная карточка;
- очищаются поля формы;
- вызывается `router.refresh()`;
- сервер заново загружает список активных карточек.

## 6. Создание категории

Создание категории теперь идет через:

```http
POST /functions/v1/knowledge-categories
```

Payload:

```json
{
  "name": "Поддержка клиентов"
}
```

Frontend отправляет только `name`.

`slug` на фронте не создается. Это принципиальное решение: slug должен генерироваться на backend, чтобы:

- логика была единой для всех клиентов API;
- не дублировать транслитерацию в UI;
- backend мог контролировать уникальность через database constraint.

Пример backend-логики:

```txt
Поддержка клиентов -> podderzhka-klientov
```

## 7. Переименование категории

В правой панели менеджер может выбрать существующую категорию из списка, изменить название и нажать `Переименовать`.

Запрос:

```http
PATCH /functions/v1/knowledge-categories
```

Payload:

```json
{
  "id": "category-uuid",
  "name": "Техническая поддержка"
}
```

При изменении `name` backend пересоздает `slug`.

Frontend снова не отправляет `slug`, потому что не должен знать правила его генерации.

## 8. Удаление категории

Удаление категории идет через:

```http
DELETE /functions/v1/knowledge-categories
```

Payload:

```json
{
  "id": "category-uuid"
}
```

Удаление мягкое: backend выставляет:

```txt
is_active = false
```

Строка остается в базе, чтобы не ломать существующие записи `knowledge_base`, которые уже ссылаются на эту категорию через `category_id`.

В интерфейсе категория исчезает из активного списка после `router.refresh()`.

## 9. Изменения в интерфейсе

Основной client component:

```txt
app/knowledge-base/knowledge-base-workspace.tsx
```

Теперь левая часть работает как список активных карточек базы знаний:

- клик по карточке открывает ее в центральной форме;
- кнопка `Добавить` очищает форму и включает режим создания;
- если карточка выбрана, кнопка формы называется `Обновить`;
- если карточка новая, кнопка формы называется `Сохранить`;
- для выбранной карточки появляется кнопка `Удалить`.

Правая часть теперь работает с категориями:

- показывает список активных категорий;
- клик по категории подставляет ее название в форму;
- выбранную категорию можно переименовать;
- можно переключиться обратно в режим новой категории;
- выбранную категорию можно мягко удалить.

Для опасных действий используется `window.confirm()`:

- удалить карточку;
- удалить категорию.

Это простая защита от случайного клика.

## 10. Обновление данных после мутаций

После успешного `POST`, `PATCH` или `DELETE` вызывается:

```ts
revalidatePath("/knowledge-base")
```

в server action и:

```ts
router.refresh()
```

в client component.

Зачем оба действия:

- `revalidatePath()` сбрасывает серверный cache для страницы;
- `router.refresh()` просит Next.js заново получить server component данные.

После этого список карточек и категорий обновляется без ручной перезагрузки браузера.

## 11. Загрузка данных из Supabase

Файл:

```txt
app/knowledge-base/queries.ts
```

Загружает:

- активные категории из `knowledge_categories`;
- активные записи базы знаний из `knowledge_base`;
- название категории через связь `knowledge_categories(name)`.

Для знаний уже используется фильтр:

```ts
.eq("is_active", true)
```

Для категорий добавлена фильтрация активных записей:

```ts
// будет добавлено после backend migration с колонкой is_active
```

Важно: в текущей схеме проекта колонка `knowledge_categories.is_active` еще не добавлена, поэтому frontend пока не фильтрует категории по этому полю. После backend migration для soft delete категорий нужно:

1. добавить колонку `is_active` в `knowledge_categories`;
2. обновить Supabase types;
3. вернуть фильтр активных категорий в `getKnowledgeCategories()`.

Типы обновляются командой:

```bash
pnpm supabase:types
```

## 12. Комментарии в коде

В код добавлены русские комментарии рядом с важными местами:

- получение Supabase session и manager profile;
- вызов Edge Functions;
- назначение HTTP-методов `POST`, `PATCH`, `DELETE`;
- почему frontend не генерирует `slug`;
- почему frontend не генерирует `embedding`;
- зачем нужен `revalidatePath`;
- зачем нужен `router.refresh`;
- почему удаление мягкое.

Это нужно, чтобы по коду было понятно не только что происходит, но и почему так сделано.

## 13. Проверка проекта

После изменений проект проверен командами:

```bash
pnpm lint
pnpm build
```

Обе проверки прошли успешно.

`pnpm build` проверяет:

- TypeScript;
- сборку Next.js;
- server actions;
- client components;
- production route generation.

## 14. Что будет дальше

Следующий этап - подключить автоматический ответ клиенту с помощью AI.

Идея:

1. Клиент пишет вопрос в Telegram.
2. Backend ищет похожие записи в `knowledge_base` через embedding / semantic search.
3. Если найден уверенный ответ, бот отвечает клиенту сам.
4. Если уверенности недостаточно, диалог остается для менеджера.
5. Менеджер может дополнять базу знаний новыми карточками, чтобы бот со временем отвечал лучше.

Важно: бот должен отвечать самостоятельно только на те вопросы, на которые он действительно может ответить по базе знаний. Если подходящей записи нет, лучше передать вопрос менеджеру, чем дать случайный ответ.
