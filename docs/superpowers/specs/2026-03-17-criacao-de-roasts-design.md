# Especificacao: criacao de roasts com IA

## Contexto

O `DevRoast` ja possui:

- homepage com editor de codigo, toggle de `roast mode` e CTA de submit;
- camada de dados em `Drizzle + Postgres` com schema de `submissions`, `roast_results`, `roast_issues` e `roast_diff_lines`;
- camada de API com `tRPC` para `home` e `leaderboard`;
- tela de resultado ainda estatica em `src/app/result/[submissionId]/_components/submission-result-view.tsx`.

A feature mais importante agora e ativar o fluxo real de criacao de roast: usuario envia codigo, backend chama IA, persiste o resultado e exibe a analise.

## Objetivo desta especificacao

Definir o desenho do MVP de criacao de roasts com processamento sincrono, mantendo `tRPC` como fronteira de backend, suportando `roast mode` por tom de resposta e sem implementar compartilhamento nesta fase.

## Resumo executivo

### Recomendacao

Implementar um fluxo sincrono via `tRPC` com mutation `createSubmission`, persistencia transacional de status/resultados e renderizacao real da pagina de resultado por `submissionId`, usando `OpenAI` como provider inicial configuravel por ambiente.

### Decisoes sugeridas

- usar `tRPC` como boundary para leitura e criacao de roast (sem Server Action para esse fluxo);
- processar o roast de forma sincrona no MVP;
- `roast mode` altera apenas o tom (`honest` vs `full_roast`), sem mudar rubric tecnica;
- linguagem manual selecionada pelo usuario tem precedencia sobre auto-detect;
- em falha de provider, marcar submissao como `failed` e exibir retry na UI;
- `share roast` fica fora de escopo funcional neste ciclo;
- provider inicial: `OpenAI`, atras de adaptador (`provider abstraction`) para troca futura.

## Abordagens consideradas

### 1) Sincroma via tRPC (recomendada)

- prós: simples para MVP, consistente com arquitetura existente, menor custo de coordenacao;
- contras: maior latencia percebida no submit e risco de timeout dependendo do provider.

### 2) Server Action para create + tRPC para leitura

- prós: boa ergonomia no App Router para formularios;
- contras: cria dois boundaries de backend e quebra padrao atual do projeto.

### 3) Assincrono com polling desde o inicio

- prós: mais resiliente para cargas maiores e jobs longos;
- contras: over-engineering para escopo atual, aumenta complexidade de produto e infraestrutura.

## Arquitetura proposta

### Limites e unidades

- `src/trpc/routers/roasts.ts`
  - valida contrato de entrada/saida com `zod`;
  - orquestra persistencia + chamada de IA;
  - nao contem SQL bruto.
- `src/lib/roasts/*`
  - `buildPrompt`: aplica tom por `roastMode`;
  - `runRoastAnalysis`: chamada ao provider;
  - `normalizeRoastOutput`: valida e normaliza payload da IA para modelo interno.
- `src/db/queries/roasts.ts`
  - consultas reutilizaveis para leitura do resultado por `submissionId`;
  - sem acoplamento a pagina.
- UI (`src/app/_components` e `src/app/result/[submissionId]`)
  - home dispara mutation;
  - result renderiza dados reais.

Cada unidade tem responsabilidade unica e interface explicita (router, service, query, view), permitindo evolucao interna sem quebrar consumidores.

## Contratos de API (MVP)

### `roasts.createSubmission` (mutation)

Input:

- `code: string` (nao vazio, respeitando limite da home)
- `roastMode: "honest" | "full_roast"`
- `language: string` (manual se houver override, senao auto-detect)
- `source?: "web"` (default `web`)

Output:

- sucesso: `{ submissionId: string, publicId: string, status: "completed" }`
- falha tratada: erro tipado de dominio, com codigo explicito, no formato:
  - `{ code: "PROVIDER_TIMEOUT" | "PROVIDER_UNAVAILABLE" | "INVALID_PROVIDER_OUTPUT" | "PERSISTENCE_ERROR", message: string, submissionId?: string }`

### `roasts.getBySubmissionId` (query)

Input:

- `submissionId: string` (UUID)

Output:

- `completed`: payload completo para tela final
  - dados da submissao (`originalCode`, `language`, `lineCount`, `roastMode`, `status`)
  - resultado (`score`, `verdict`, `headline`, `summary`)
  - itens (`issues[]`)
  - diff (`diffLines[]`)
- `failed`: `{ status: "failed", processingError: string }`
- `processing`: `{ status: "processing" }`
- `not_found`: erro tipado `{ code: "RESULT_NOT_FOUND", message: string }`

## Fluxo de dados

1. Usuario envia formulario na home.
2. Front chama `roasts.createSubmission`.
3. Backend cria submissao com status `processing`.
4. Backend monta prompt (rubric fixa + variacao de tom por mode).
5. Backend chama `OpenAI` via adaptador de provider.
6. Resposta da IA e validada/normalizada.
7. Backend persiste `roast_results`, `roast_issues`, `roast_diff_lines`.
8. Backend atualiza submissao para `completed`.
9. Front navega para `/result/[submissionId]` e pagina consulta dados reais.

Regra de navegacao no submit:

- se `createSubmission` retornar sucesso, navegar para `/result/[submissionId]`;
- se `createSubmission` retornar erro, permanecer na home e exibir feedback inline + CTA de retry.

## Erros e resiliencia

- qualquer falha de provider/parsing/persistencia apos criacao da submissao deve:
  - atualizar `submissions.status` para `failed`;
  - salvar `processingError` sanitizado (sem segredo);
  - retornar erro tipado para UI.
- UI deve exibir estado de erro com CTA de retry.
- retry no MVP cria nova submissao (sem reaproveitar linhas parciais).
- pagina de resultado deve suportar renderizacao por status:
  - `processing`: estado de processamento (fallback curto, sem polling nesta fase);
  - `failed`: estado de erro com opcao de reenviar a partir da home;
  - `completed`: renderizacao completa do roast.

## Integracao de UI

- `HomeHero`: toggle de roast mode deixa de ser apenas visual e entra no payload de submit.
- `HomeCodeEditor`: linguagem final enviada respeita override manual.
- `SubmissionResultView`: remover fixture estatica e consumir dados da query real.
- CTA `$ share_roast`: manter sem fluxo funcional neste ciclo.

## Provider de IA

- provider inicial: `OpenAI`;
- modelo exato fica configuravel por env (ex.: `OPENAI_MODEL`);
- chave e configuracao via variaveis de ambiente;
- interface interna deve permitir trocar provider sem alterar contrato de `tRPC`.

## Fora de escopo

- compartilhar roast por link publico;
- fila de jobs/polling/webhooks;
- autenticacao e historico por usuario;
- ranking por reactions/votos.

## Criterios de aceite

- submit real cria roast persistido e abre resultado real;
- `roastMode` muda tom textual sem alterar criterios tecnicos;
- override manual de linguagem e respeitado na persistencia;
- erro de IA nao quebra fluxo: submissao vai para `failed` com retry disponivel;
- `npm run format`, `npm run lint` e `npm run build` executam sem erro apos implementacao.
