# Project Rules

- Product: `DevRoast`, a static-first web app that lets users paste code and get a roast-style review experience.
- Stack: Next.js App Router, React, Tailwind CSS v4, Biome, Base UI, Shiki.
- Design source of truth: always check `devroast.pen` in Pencil before changing UI.
- UI primitives live in `src/components/ui` and must use named exports only.
- Prefer compound components with namespace API for composed UI, like `Section.Root` and `Toggle.Control`.
- Reuse semantic Tailwind tokens from `src/app/globals.css`; avoid arbitrary values when a scale/token is possible.
- `font-mono` is JetBrains Mono; `font-sans` uses the native system stack.
- Keep pages composed from smaller app-local pieces in `src/app/_components` when the UI is page-specific.
- Validate every meaningful change with `npm run format`, `npm run lint`, and `npm run build`.
