# Especificacao: base de dados com Drizzle ORM + Postgres

## Contexto

O `DevRoast` ainda esta em fase static-first. O `README.md` deixa claro que hoje o produto funciona com dados estaticos, enquanto o layout em `devroast.pen` ja descreve um fluxo completo de produto com tres momentos bem definidos:

- entrada de codigo na homepage;
- tela de resultado do roast;
- leaderboard publico com os piores codigos.

Isso significa que ja existe material suficiente para definir um primeiro modelo relacional e preparar a integracao do Drizzle ORM com Postgres sem depender de um backend "completo" desde o primeiro dia.

## Fontes consideradas

- `README.md`
- `devroast.pen`, especialmente as telas `Screen 1 - Code Input`, `Screen 2 - Roast Results` e `Screen 3 - Shame Leaderboard`
- implementacao atual em `src/app/page.tsx`, `src/app/_components/home-hero.tsx`, `src/app/_components/home-code-editor.tsx` e `src/app/_components/home-leaderboard-preview.tsx`
- documentacao atual do Drizzle via Context7, usando `/drizzle-team/drizzle-orm-docs`
- documentacao atual do Docker Compose via Context7, usando `/docker/compose`

## O que o layout revela sobre o dominio

Pelo layout atual, o produto precisa persistir pelo menos estas informacoes:

- o codigo original submetido pelo usuario;
- o modo de roast usado no envio;
- a linguagem do snippet exibida no resultado e no leaderboard;
- a nota geral do roast;
- um veredito textual curto;
- uma frase principal de roast;
- uma lista de pontos analisados, com severidade e explicacao;
- um diff sugerido de melhoria;
- dados suficientes para montar ranking publico.

Tambem existe um CTA de compartilhamento na tela de resultado, o que sugere que cada roast finalizado precisa ter algum identificador publico estavel.

## Objetivo desta especificacao

Definir uma primeira camada de persistencia com:

- Postgres rodando localmente via Docker Compose;
- Drizzle ORM + drizzle-kit integrados ao projeto Next.js;
- schema inicial coerente com o produto atual;
- enums centrais do dominio;
- checklist de implementacao para sair do mock estatico e chegar a uma base real.

## Resumo executivo

### Recomendacao

Implementar um MVP de dados com quatro tabelas principais:

1. `submissions`
2. `roast_results`
3. `roast_issues`
4. `roast_diff_lines`

E cinco enums principais:

1. `submission_status`
2. `roast_mode`
3. `roast_verdict`
4. `issue_severity`
5. `diff_line_type`

### Decisoes sugeridas

- usar `Postgres` como banco principal de desenvolvimento local;
- usar `drizzle-orm` com driver `pg` e `drizzle-orm/node-postgres`;
- usar `drizzle-kit` para gerar migrations SQL versionadas;
- usar `uuid` como chave primaria em todas as tabelas de dominio;
- manter leaderboard como consulta derivada, e nao como tabela fisica no MVP;
- manter autenticacao fora do escopo inicial;
- permitir submissao anonima no MVP;
- guardar um identificador publico unico para compartilhamento do roast.

## Escopo funcional do banco no MVP

### Entra no MVP

- persistencia de submissao de codigo;
- persistencia do resultado do roast;
- persistencia dos cards de analise;
- persistencia do diff sugerido;
- listagem publica para leaderboard;
- suporte a compartilhamento por identificador publico;
- estados basicos de processamento.

### Fica fora do MVP

- contas de usuario;
- login social;
- historico por usuario autenticado;
- likes, votos ou comentarios no leaderboard;
- versionamento de multiplos resultados para a mesma submissao;
- armazenamento de arquivos anexados;
- billing, times ou multi-tenant.

## Estrutura recomendada de arquivos

Seguindo a linha recomendada pela documentacao do Drizzle para separar conexao, schema e migrations:

```text
.
├─ docker-compose.yml
├─ .env
├─ .env.example
├─ drizzle.config.ts
├─ drizzle/
│  ├─ meta/
│  └─ *.sql
└─ src/
   └─ db/
      ├─ index.ts
      ├─ schema/
      │  ├─ enums.ts
      │  ├─ submissions.ts
      │  ├─ roast-results.ts
      │  ├─ roast-issues.ts
      │  ├─ roast-diff-lines.ts
      │  └─ relations.ts
      ├─ queries/
      └─ seeds/
```

## Dependencias recomendadas

De acordo com a documentacao atual do Drizzle consultada via Context7:

```bash
npm install drizzle-orm pg
npm install -D drizzle-kit @types/pg dotenv
```

## Variaveis de ambiente sugeridas

```bash
DATABASE_URL=postgresql://devroast:devroast@localhost:5432/devroast
DB_HOST=localhost
DB_PORT=5432
DB_NAME=devroast
DB_USERNAME=devroast
DB_PASSWORD=devroast
```

`DATABASE_URL` deve ser a fonte principal para a aplicacao. As demais variaveis podem continuar existindo para facilitar `drizzle.config.ts`, scripts locais e debugging.

## Docker Compose recomendado

Com base na documentacao do Docker Compose consultada via Context7, a composicao local deve usar volume persistente e `healthcheck`:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: devroast-postgres
    restart: unless-stopped
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: devroast
      POSTGRES_USER: devroast
      POSTGRES_PASSWORD: devroast
    volumes:
      - devroast_postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U devroast -d devroast"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  devroast_postgres_data:
```

### Scripts recomendados no `package.json`

- `db:up`: `docker compose up -d`
- `db:down`: `docker compose down`
- `db:generate`: `drizzle-kit generate`
- `db:migrate`: `drizzle-kit migrate`
- `db:push`: `drizzle-kit push`
- `db:studio`: `drizzle-kit studio`

Observacao: para ambiente de equipe, prefira `generate` + `migrate` como fluxo principal. `push` pode ficar restrito a exploracao local.

## Configuracao recomendada do Drizzle

### `drizzle.config.ts`

A documentacao atual do Drizzle recomenda `defineConfig` com `dialect: "postgresql"`, schema e pasta de saida para migrations. Adaptado ao projeto:

```ts
import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema",
  out: "./drizzle",
  dbCredentials: {
    host: process.env.DB_HOST!,
    port: Number(process.env.DB_PORT!),
    user: process.env.DB_USERNAME!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_NAME!,
  },
  verbose: true,
  strict: true,
});
```

### `src/db/index.ts`

A conexao sugerida pelo Drizzle para `pg` no contexto deste projeto e:

```ts
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle({ client: pool });
```

## Modelo de dados proposto

## Visao geral das entidades

```text
submissions
  1 -> 1 roast_results
  1 -> N roast_issues
  1 -> N roast_diff_lines
```

Mais precisamente:

- `submissions` e a entidade de entrada;
- `roast_results` guarda o resumo consolidado do roast;
- `roast_issues` guarda os cards de analise mostrados na tela de resultado;
- `roast_diff_lines` guarda o bloco de diff sugerido;
- o leaderboard e uma consulta sobre `submissions + roast_results`.

## Enums recomendados

### `submission_status`

- `pending`
- `processing`
- `completed`
- `failed`

Motivo: a submissao pode ser criada antes do roast terminar, especialmente se o processamento for assincrono.

### `roast_mode`

- `honest`
- `full_roast`

Motivo: o layout atual mostra explicitamente um toggle de roast mode. Mesmo que o texto do layout seja "maximum sarcasm enabled", para banco vale um enum estavel e neutro.

### `roast_verdict`

- `needs_serious_help`
- `rough`
- `salvageable`
- `solid`

Motivo: a tela de resultado mostra um veredito curto em destaque e a nota geral sozinha nao representa toda a semantica do resultado.

### `issue_severity`

- `critical`
- `warning`
- `good`

Motivo: os cards da tela de resultado usam exatamente essa logica visual.

### `diff_line_type`

- `context`
- `removed`
- `added`

Motivo: o bloco de diff mostrado no layout segue esse modelo classico.

## Tabelas recomendadas

## 1) `submissions`

Representa o envio original do usuario.

### Campos

- `id uuid primary key default gen_random_uuid()`
- `public_id text not null unique`
- `status submission_status not null default 'pending'`
- `roast_mode roast_mode not null default 'full_roast'`
- `source text not null default 'web'`
- `language text null`
- `original_code text not null`
- `code_hash text not null`
- `line_count integer not null`
- `is_public boolean not null default true`
- `processing_error text null`
- `created_at timestamp with time zone not null default now()`
- `updated_at timestamp with time zone not null default now()`

### Regras

- `public_id` deve ser seguro para URL e servir para compartilhamento;
- `language` pode comecar como `text` em vez de enum para nao travar o produto em uma lista fechada cedo demais;
- `code_hash` ajuda deduplicacao, analytics e troubleshooting;
- `line_count` evita recalculo em consultas simples;
- `is_public` controla participacao no leaderboard.

### Indices recomendados

- indice unico em `public_id`
- indice em `status`
- indice em `created_at desc`
- indice em `code_hash`
- indice composto em `is_public, created_at desc`

## 2) `roast_results`

Representa o resumo final exibido na tela de resultado.

### Campos

- `id uuid primary key default gen_random_uuid()`
- `submission_id uuid not null unique references submissions(id) on delete cascade`
- `score numeric(3,1) not null`
- `verdict roast_verdict not null`
- `headline text not null`
- `summary text not null`
- `language_label text null`
- `share_slug text not null unique`
- `provider text null`
- `provider_model text null`
- `created_at timestamp with time zone not null default now()`
- `updated_at timestamp with time zone not null default now()`

### Regras

- `submission_id` deve ser `unique` porque no MVP cada submissao gera um unico roast final;
- `score` deve aceitar casas decimais como `3.5`, visto no layout;
- `headline` cobre o texto de impacto principal do roast;
- `summary` pode guardar um texto maior para futura expansao, mesmo que o layout atual mostre uma frase principal;
- `share_slug` pode ser usado em uma rota como `/r/[shareSlug]`.

### Indices recomendados

- indice unico em `submission_id`
- indice unico em `share_slug`
- indice em `score asc`
- indice em `verdict`

## 3) `roast_issues`

Representa os cards de analise da tela de resultado.

### Campos

- `id uuid primary key default gen_random_uuid()`
- `submission_id uuid not null references submissions(id) on delete cascade`
- `severity issue_severity not null`
- `title text not null`
- `description text not null`
- `position integer not null`
- `created_at timestamp with time zone not null default now()`

### Regras

- usar `submission_id` simplifica leitura por pagina e evita join obrigatorio com `roast_results`;
- `position` controla a ordem visual dos cards;
- pode haver tanto pontos negativos quanto positivos, por isso `good` tambem entra como severidade valida.

### Indices recomendados

- indice composto em `submission_id, position`
- indice em `severity`

## 4) `roast_diff_lines`

Representa o bloco de diff sugerido na tela de resultado.

### Campos

- `id uuid primary key default gen_random_uuid()`
- `submission_id uuid not null references submissions(id) on delete cascade`
- `line_type diff_line_type not null`
- `content text not null`
- `position integer not null`
- `created_at timestamp with time zone not null default now()`

### Regras

- `position` define a ordem das linhas do diff;
- o modelo aceita blocos com mistura de contexto, remocao e adicao;
- ligar direto em `submission_id` mantem leitura simples para a tela de resultado.

### Indices recomendados

- indice composto em `submission_id, position`
- indice em `line_type`

## Tabelas que NAO recomendo para o MVP

### `leaderboard_entries`

Nao recomendo tabela fisica no inicio. O leaderboard mostrado no layout pode ser derivado de consulta, por exemplo:

- somente `submissions.status = 'completed'`
- somente `submissions.is_public = true`
- join com `roast_results`
- ordenacao por `roast_results.score asc`, depois `submissions.created_at asc`

Se o ranking ficar pesado no futuro, ai sim vale discutir view materializada ou tabela de snapshot.

### `users`

Nao recomendo agora. O layout e o README ainda nao mostram fluxo de autenticacao, perfil ou ownership explicita por usuario.

## Consulta conceitual do leaderboard

O leaderboard precisa expor:

- rank;
- nota;
- preview do codigo;
- linguagem;
- total de linhas;
- id publico para navegar ao detalhe compartilhavel.

Regra de ranking sugerida:

- pior score primeiro;
- empate por submissao mais antiga primeiro;
- somente itens publicos e completos.

Para preview, basta truncar `original_code` na camada de aplicacao ou via SQL em uma view futura.

## Exemplo de schema em Drizzle

Trecho ilustrativo do estilo esperado, usando `pgEnum()` e `pgTable()` conforme a documentacao atual do Drizzle:

```ts
import {
  boolean,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const submissionStatusEnum = pgEnum("submission_status", [
  "pending",
  "processing",
  "completed",
  "failed",
]);

export const roastModeEnum = pgEnum("roast_mode", ["honest", "full_roast"]);

export const roastVerdictEnum = pgEnum("roast_verdict", [
  "needs_serious_help",
  "rough",
  "salvageable",
  "solid",
]);

export const submissions = pgTable("submissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  publicId: text("public_id").notNull().unique(),
  status: submissionStatusEnum("status").notNull().default("pending"),
  roastMode: roastModeEnum("roast_mode").notNull().default("full_roast"),
  language: text("language"),
  originalCode: text("original_code").notNull(),
  codeHash: text("code_hash").notNull(),
  lineCount: integer("line_count").notNull(),
  isPublic: boolean("is_public").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const roastResults = pgTable("roast_results", {
  id: uuid("id").defaultRandom().primaryKey(),
  submissionId: uuid("submission_id").notNull().unique(),
  score: numeric("score", { precision: 3, scale: 1 }).notNull(),
  verdict: roastVerdictEnum("verdict").notNull(),
  headline: text("headline").notNull(),
  summary: text("summary").notNull(),
  shareSlug: text("share_slug").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
```

## Estrategia de migracao sugerida

### Migration 0000

- criar enums
- criar `submissions`
- criar `roast_results`
- criar `roast_issues`
- criar `roast_diff_lines`
- criar indices principais

### Migration 0001

- opcionalmente inserir seed local com exemplos do layout atual
- opcionalmente criar view SQL para leaderboard publico

## Seeds iniciais recomendados

Vale criar um seed minimo reaproveitando o conteudo que hoje ja aparece no produto:

- 3 submissions para o preview da homepage;
- 1 roast completo para a tela de resultado;
- 5 entries para o leaderboard completo;
- severidades `critical`, `warning` e `good` para validar os componentes atuais.

Isso ajuda a substituir mocks hardcoded por dados reais cedo, sem depender de IA ou backend externo.

## Plano de implementacao recomendado

## Fase 1 - Infra local

- criar `docker-compose.yml` com Postgres e volume persistente;
- criar `.env.example` com variaveis do banco;
- subir o banco com `docker compose up -d`;
- validar `pg_isready` e conexao local.

## Fase 2 - Fundacao Drizzle

- instalar `drizzle-orm`, `pg`, `drizzle-kit`, `@types/pg` e `dotenv`;
- criar `drizzle.config.ts`;
- criar `src/db/index.ts`;
- criar pasta `src/db/schema`.

## Fase 3 - Schema inicial

- definir enums em `src/db/schema/enums.ts`;
- definir `submissions`;
- definir `roast_results`;
- definir `roast_issues`;
- definir `roast_diff_lines`;
- definir relacoes e indices.

## Fase 4 - Migrations e seed

- gerar migration inicial com `drizzle-kit generate`;
- aplicar migration no banco local;
- criar seed com dados equivalentes aos mocks atuais;
- validar leitura com queries simples.

## Fase 5 - Integracao com a app

- substituir o array estatico do leaderboard por query real;
- criar fluxo de criacao de submission;
- criar fluxo de leitura do roast por `public_id` ou `share_slug`;
- preparar interface para processamento assincrono do roast.

## Fase 6 - Qualidade

- rodar `npm run format`;
- rodar `npm run lint`;
- rodar `npm run build`;
- revisar tipos retornados do banco nas rotas/server actions.

## To-dos de implementacao

- [ ] Adicionar dependencias de Drizzle e Postgres no projeto
- [ ] Criar `docker-compose.yml` com Postgres 16 e `healthcheck`
- [ ] Criar `.env.example` com `DATABASE_URL` e variaveis auxiliares
- [ ] Criar `drizzle.config.ts` apontando para `src/db/schema`
- [ ] Criar `src/db/index.ts` com `drizzle-orm/node-postgres`
- [ ] Criar `src/db/schema/enums.ts`
- [ ] Criar `src/db/schema/submissions.ts`
- [ ] Criar `src/db/schema/roast-results.ts`
- [ ] Criar `src/db/schema/roast-issues.ts`
- [ ] Criar `src/db/schema/roast-diff-lines.ts`
- [ ] Criar `src/db/schema/relations.ts`
- [ ] Gerar migration inicial
- [ ] Aplicar migration no banco local
- [ ] Criar seed basico a partir dos mocks atuais
- [ ] Trocar o preview da homepage para consultar dados reais
- [ ] Criar query do leaderboard ordenando por menor score
- [ ] Criar leitura do resultado por `share_slug` ou `public_id`
- [ ] Definir se o processamento do roast sera sincrono ou por fila
- [ ] Decidir se `language` continuara livre em `text` ou evoluira para enum no futuro
- [ ] Padronizar atualizacao de `updated_at`
- [ ] Rodar format, lint e build ao final

## Perguntas em aberto

Essas perguntas nao bloqueiam a implementacao do schema inicial, mas impactam a proxima iteracao:

1. o roast sera processado imediatamente na mesma requisicao ou por job/fila em background?
2. o leaderboard deve listar apenas resultados explicitamente publicos ou todo roast sera publico por padrao no MVP?
3. queremos guardar a linguagem exatamente como detectada pelo sistema ou permitir override manual pelo usuario antes de persistir?

## O que eu faria agora

Se a implementacao comecasse hoje, eu seguiria esta ordem:

1. infra local com Docker Compose + Postgres;
2. Drizzle configurado com migration inicial;
3. quatro tabelas do MVP descritas aqui;
4. seed espelhando os mocks do layout;
5. homepage e leaderboard lendo do banco antes de integrar qualquer motor real de roast.
