# Especificacao: camada de API com tRPC no Next.js App Router

## Contexto

O `DevRoast` ja possui dados reais com `Drizzle + Postgres`, mas hoje a aplicacao mistura acesso direto ao banco com componentes de pagina e ainda nao tem uma camada de API/backend tipada para organizar leituras, mutacoes e evolucao futura.

No estado atual:

- a homepage e client-side em `src/app/page.tsx`;
- a leaderboard e a pagina de resultado sao server-rendered, mas ainda sem uma camada de API unificada;
- as consultas vivem em `src/db/queries` e sao um bom ponto de reaproveitamento;
- a proxima etapa precisa funcionar bem com `Next.js App Router`, `SSR` e `Server Components`.

Esta spec segue a documentacao atual do tRPC para:

- `setup`: `https://trpc.io/docs/client/tanstack-react-query/setup`
- `server components`: `https://trpc.io/docs/client/tanstack-react-query/server-components`

## Objetivo desta especificacao

Definir a adocao do `tRPC` como camada oficial de API/backend do projeto, mantendo o `Drizzle` como camada de dados e integrando a stack com `TanStack React Query`, `SSR` e `Server Components` no App Router.

## Resumo executivo

### Recomendacao

Implementar o `tRPC` no padrao recomendado para `Next.js App Router` com `TanStack React Query`:

1. `tRPC` como fronteira de API do app;
2. `Drizzle` e `src/db/queries` como camada interna de acesso a dados;
3. `fetchRequestHandler` em `app/api/trpc/[trpc]/route.ts`;
4. provider client-side com `QueryClientProvider` + `TRPCProvider`;
5. helpers server-side para `prefetch` em `Server Components` com `HydrationBoundary` e `dehydrate`.

### Decisoes sugeridas

- usar `@trpc/server`, `@trpc/client`, `@trpc/tanstack-react-query` e `@tanstack/react-query`;
- usar `zod` para validar input/output das procedures;
- manter routers por dominio, comecando por `home` e `roasts`;
- manter procedures publicas no MVP e deixar auth para uma camada futura;
- nao acessar `db` direto nas paginas novas; a pagina conversa com `tRPC`;
- em `Server Components`, usar os helpers server-side do `tRPC` para `prefetch`, e nao chamadas HTTP manuais;
- em componentes client, usar `useQuery`, `useSuspenseQuery` e `useMutation` com `queryOptions` e `mutationOptions` do `tRPC`.

## Estrutura recomendada de arquivos

```text
src/
├─ app/
│  ├─ api/
│  │  └─ trpc/
│  │     └─ [trpc]/route.ts
│  └─ layout.tsx
├─ db/
│  ├─ index.ts
│  └─ queries/
├─ trpc/
│  ├─ init.ts
│  ├─ query-client.ts
│  ├─ client.tsx
│  ├─ server.ts
│  └─ routers/
│     ├─ _app.ts
│     ├─ home.ts
│     └─ roasts.ts
└─ lib/
   └─ env/
      └─ get-base-url.ts
```

## Dependencias recomendadas

Segundo a doc atual do tRPC para `TanStack React Query setup`, o setup base deve instalar:

```bash
npm install @trpc/server @trpc/client @trpc/tanstack-react-query @tanstack/react-query zod
```

`superjson` pode entrar depois, apenas se o app precisar preservar tipos ricos no client com mais frequencia.

## Arquitetura sugerida

### `src/trpc/init.ts`

Responsabilidades:

- criar `createTRPCContext`;
- inicializar `initTRPC`;
- exportar `router`, `publicProcedure` e, se necessario depois, `protectedProcedure`;
- concentrar middlewares comuns.

Contexto inicial sugerido:

- `db`
- cabecalhos da requisicao, quando existirem
- metadados uteis para logging futuro

### `src/trpc/routers/_app.ts`

- compor o `appRouter`;
- exportar `AppRouter` para tipagem do client e do server.

### Routers iniciais

`home`:

- `getStats`
- `getLeaderboardPreview`

`roasts`:

- `getByIdentifier`
- `createSubmission`

Regra: router fino, query reutilizavel em `src/db/queries`, regra de negocio no `tRPC` quando precisar orquestrar mais de uma query.

## Integracao com Next.js App Router

### Route handler

Criar `src/app/api/trpc/[trpc]/route.ts` com `fetchRequestHandler`, apontando para `appRouter` e `createTRPCContext`.

Esse arquivo e o endpoint HTTP oficial do `tRPC` no projeto: `/api/trpc`.

### Query client

Criar `src/trpc/query-client.ts` com `makeQueryClient()`.

Decisoes:

- usar `staleTime` padrao para evitar refetch imediato apos hidratacao;
- configurar `dehydrate.shouldDehydrateQuery` para incluir queries pendentes, como mostrado na doc de `server-components`;
- no browser, usar singleton do `QueryClient`.

### Provider client-side

Criar `src/trpc/client.tsx` como componente `use client`.

Responsabilidades:

- criar `TRPCProvider` com `createTRPCContext<AppRouter>()`;
- instanciar o client com `httpBatchLink`;
- encapsular `QueryClientProvider`;
- montar a URL base de `/api/trpc` com helper proprio para browser, localhost e deploy.

### Layout raiz

Envolver `src/app/layout.tsx` com o `TRPCProvider` para disponibilizar React Query e tRPC no app inteiro.

## Integracao com Server Components e SSR

### `src/trpc/server.ts`

Criar um modulo `server-only` com:

- `getQueryClient = cache(makeQueryClient)`;
- helper `trpc` server-side para produzir `queryOptions` tipados;
- utilitario de hidratacao para `HydrationBoundary`.

### Padrao de uso recomendado

Para paginas server-rendered:

1. obter `queryClient` no server;
2. chamar `prefetchQuery(trpc.<rota>.<procedure>.queryOptions(input))`;
3. renderizar `HydrationBoundary` com `dehydrate(queryClient)`;
4. consumir os dados no client com `useQuery` ou `useSuspenseQuery` usando os mesmos `queryOptions`.

Isso preserva SSR, evita duplicar fetch manual e segue o fluxo recomendado na doc de `server-components`.

## Aplicacao no DevRoast

### Homepage

- manter o editor como client component;
- mover o submit para `roasts.createSubmission` via `useMutation`;
- invalidar ou navegar para a tela de resultado apos sucesso.

### Leaderboard

- pagina continua server-rendered;
- prefetch de `home.getLeaderboardPreview` no server;
- tabela ou lista pode virar client component depois sem trocar a fonte de dados.

### Resultado do roast

- pagina usa `roasts.getByIdentifier` em vez de importar query de banco diretamente;
- `submissionId` ou `shareSlug` continuam sendo resolvidos no backend via procedure.

## Checklist de implementacao

- instalar dependencias do `tRPC` e `TanStack React Query`;
- criar `init.ts`, `query-client.ts`, `client.tsx`, `server.ts` e `routers/_app.ts`;
- criar route handler em `src/app/api/trpc/[trpc]/route.ts`;
- migrar queries de leitura iniciais para routers `home` e `roasts`;
- envolver `src/app/layout.tsx` com o provider;
- conectar a homepage via mutation `createSubmission`;
- conectar leaderboard e result page via prefetch server-side + hydration;
- validar com `npm run format`, `npm run lint` e `npm run build`.

## Criterios de sucesso

- o app passa a ter uma fronteira unica de API tipada;
- as paginas do App Router continuam com SSR onde ja faz sentido;
- componentes client usam `React Query` via `queryOptions` e `mutationOptions` do `tRPC`;
- `src/db/queries` continua reutilizavel, mas deixa de ser importado direto pelas paginas principais;
- a base fica pronta para adicionar auth, cache e invalidacao sem refatorar a arquitetura.
