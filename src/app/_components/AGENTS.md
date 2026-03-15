# App-local Components

Use these rules for page-specific components inside `src/app/_components`.

- Keep UI here when it is specific to one route or page section.
- Prefer a server/client split: server component for data composition, client component only for local state, event handlers, browser APIs, or animation.
- Do not turn an entire page into a client component when only one leaf needs client behavior.
- For conditional Tailwind class composition, prefer `twMerge(...)` instead of building class strings with array `.join(" ")`.
- Avoid arbitrary Tailwind values when a scale class exists (for example, prefer `max-h-160` over `max-h-[40rem]`).
- When a numeric metric needs a reveal animation, prefer `NumberFlow` with initial value `0` and update to the loaded value after fetch resolves.
- For that metric pattern, prefer the zero-to-value transition over `Suspense`/skeleton unless the product explicitly asks for a loading placeholder.
