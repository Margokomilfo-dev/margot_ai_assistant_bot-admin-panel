<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project preferences

- Prefer generated Supabase database types from `lib/supabase/database.types.ts` over custom TypeScript types. Add local custom types only when the generated DB types cannot express the UI shape directly.
- Remove redundant custom typization when a database type already exists for the same entity or field.
- Keep code comments concise and useful. Add comments for non-obvious business logic, backend contracts, or places where frontend behavior depends on database fields.
- Do not hardcode editable bot or manager texts when they can be controlled from admin settings.
