# UI Component Patterns

Use these rules for every new component inside `src/components/ui`.

## Source of truth

- Use the Pencil design as the visual reference before coding a component.
- Reuse the project typography and color tokens already defined in `src/app/globals.css`.
- If a new token is needed, add a semantic Tailwind theme variable first instead of hardcoding a raw color in the component.

## Exports

- Use named exports only.
- Never use `export default` in UI components.
- Prefer a local barrel file like `src/components/ui/index.ts` for re-exports.
- For composite components, prefer namespace exports like `Section.Root`, `Section.Title`, `Toggle.Root`, and `TableRow.Score`.

## Typing

- Extend the native HTML element props in TypeScript.
- Examples:
  - `ComponentProps<"button">`
  - `ComponentProps<"input">`
  - `ComponentProps<"textarea">`
- For compound components, type each subcomponent from its native element instead of centralizing many props in a single root API.
- If the component has variants, combine native props with `VariantProps<typeof componentVariants>`.

## Variants

- Use `tailwind-variants` for reusable visual variants.
- Keep the style generator exported, for example `buttonVariants`.
- Prefer semantic variant names like `primary`, `secondary`, `ghost`, `destructive`, `sm`, `md`, `lg`.
- When passing custom classes, let `tailwind-variants` merge them:

```tsx
className={buttonVariants({ variant, size, className })}
```

- Do not use `twMerge` when the component already uses `tailwind-variants` for class composition.

## Tailwind usage

- Use Tailwind classes backed by theme variables like `bg-accent-green` or `text-text-primary`.
- Avoid arbitrary values such as `text-[13px]`, `px-[22px]`, or `bg-[#10B981]`.
- Prefer the closest scale value from Tailwind unless a new semantic token is added globally.
- Keep base styles in the `base` section of `tv()` and use variants only for intentional differences.

## Typography

- Use `font-sans` for traditional UI copy with the default system font stack.
- Use `font-mono` for JetBrains Mono code-like or terminal-like elements.
- Match the Pencil hierarchy, but normalize to Tailwind's scale instead of arbitrary font sizes.

## Accessibility

- Preserve the native element semantics.
- Keep keyboard focus visible with semantic ring tokens.
- Respect disabled states with visual feedback and blocked pointer interaction where appropriate.
- Default buttons to `type="button"` unless the component intentionally behaves like submit.

## Validation

- After creating or updating a UI component, run:
  - `npm run format`
  - `npm run lint`
  - `npm run build`
