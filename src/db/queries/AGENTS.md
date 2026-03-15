# Query Layer

Use these rules for modules inside `src/db/queries`.

- Treat this folder as the reusable data-access layer over `Drizzle`.
- Keep queries grouped by domain and independent from route or component concerns.
- Return data shaped for reuse, not for one specific page component.
- If a flow already has a `tRPC` procedure, pages should consume the procedure instead of importing the query module directly.
