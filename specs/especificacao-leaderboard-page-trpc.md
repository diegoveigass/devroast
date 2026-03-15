# Especificacao: leaderboard page com tRPC

## Contexto

A rota `src/app/leaderboard/page.tsx` ainda usa dados mockados em `src/app/leaderboard/_components/leaderboard-view.tsx`. O projeto ja adotou `tRPC` na homepage e precisa seguir o mesmo padrao de backend tipado, Server Components e loading state com `Suspense`.

## Objetivo desta especificacao

Implementar a pagina de leaderboard com dados reais via `tRPC`, exibindo no maximo os 20 piores trechos de codigo com syntax highlight e bloco colapsavel.

## Resumo executivo

### Recomendacao

Criar um fluxo dedicado de leaderboard no backend (`db/queries` + `tRPC router`) e migrar a pagina para composicao server-first com `Suspense` e skeleton.

### Decisoes sugeridas

- usar filtro apenas `status = completed`;
- limitar no backend para no maximo `20` itens;
- manter ordenacao por pior score (`score asc`) e desempate por `createdAt asc`;
- usar `CodeBlock` para syntax highlight e `@base-ui/react/collapsible` para expandir/recolher codigo;
- carregar metricas de cabecalho (total e media) junto dos itens com `await Promise.all([...])` quando forem queries independentes;
- manter a pagina como Server Component, com fallback de loading em `Suspense`.
