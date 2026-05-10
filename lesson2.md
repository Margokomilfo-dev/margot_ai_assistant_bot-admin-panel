# Lesson 2: Messages Architecture
https://margot-ai-assistant-bot-admin-panel.vercel.app/

## Current structure

```text
app/messages/
  page.tsx      // Next.js route entry point and page layout
  queries.ts   // Supabase read logic
  types.ts     // Shared Message type
  utils.ts     // Pure display formatting helpers
```

## Responsibilities

- `page.tsx` renders the `/messages` page and owns Next.js route config such as `dynamic`.
- `queries.ts` loads messages from Supabase.
- `types.ts` keeps the shared `Message` shape.
- `utils.ts` formats message data for display, such as user names and dates.

## Why this is correct

This keeps the route file focused on rendering, keeps database access separate, and avoids coupling helpers to data-fetching modules. The structure is small, clear, and appropriate for a route-specific feature in the Next.js App Router.
