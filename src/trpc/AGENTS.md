# tRPC Patterns

Use these rules for files inside `src/trpc`.

- `tRPC` is the typed API boundary of the app; keep routers organized by domain.
- Keep routers thin: validation and orchestration live here, raw database access stays in `src/db/queries`.
- Export shared primitives from `src/trpc/init.ts` and compose the root router in `src/trpc/routers/_app.ts`.
- Use `zod` for procedure input/output when it adds safety to the contract.
- In App Router, prefer the established split: route handler in `src/app/api/trpc/[trpc]/route.ts`, provider in `src/trpc/client.tsx`, server proxy in `src/trpc/server.ts`.
- In components, prefer `queryOptions()` and `mutationOptions()` from `tRPC` instead of handwritten query keys/functions.
- Do not fetch `/api/trpc` manually from server components when the local server proxy can be used.
- When a procedure needs multiple independent reads, execute them in parallel with `await Promise.all([...])`.
