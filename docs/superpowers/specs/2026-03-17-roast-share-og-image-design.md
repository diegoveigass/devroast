# Especificacao: imagem Open Graph automatica para resultados de roast

## Contexto

O `DevRoast` ja possui:

- pagina de resultado em `src/app/result/[submissionId]/page.tsx` com carregamento server-side via `tRPC`;
- tela de resultado completa em `src/app/result/[submissionId]/_components/submission-result-view.tsx`;
- link compartilhavel baseado no proprio `submissionId` da rota de resultado;
- design source of truth em `devroast.pen`, com o frame selecionado `Screen 4 - OG Image` no editor ativo durante o brainstorming.

Hoje, compartilhar a URL do resultado nao publica uma imagem Open Graph especifica do roast. A feature precisa adicionar essa imagem automatica ao embed do link, usando o design ja aprovado no Pencil e a biblioteca `Takumi` para gerar a imagem no servidor.

## Objetivo desta especificacao

Definir o desenho do MVP de compartilhamento visual para resultados `completed`, fazendo com que a propria pagina `result/[submissionId]` exponha metadata dinamica com imagem Open Graph gerada sob demanda e cacheada, sem criar rota publica separada de share nem persistir arquivos de imagem.

## Resumo executivo

### Recomendacao

Implementar metadata dinamica na propria pagina de resultado e apontar `openGraph.images` para uma rota de imagem do mesmo segmento, gerada com `Takumi` a partir de um view model enxuto derivado do roast persistido.

### Decisoes sugeridas

- suportar apenas resultados com status `completed` neste ciclo;
- manter o link compartilhavel na propria rota `result/[submissionId]`;
- usar o `submissionId` atual como identificador do share;
- gerar a imagem sob demanda com cache HTTP/revalidate, sem salvar em disco ou bucket;
- usar apenas dados ja exibidos na tela: `score`, `verdict`, `language`, `lineCount` e `headline`;
- reproduzir o layout do frame `Screen 4 - OG Image` como source of truth visual;
- manter pagina HTML e imagem OG com mappers separados, mas alimentados pela mesma fonte de dados.

## Abordagens consideradas

### 1) Metadata dinamica na pagina + rota OG no mesmo segmento (recomendada)

- pros: encaixa naturalmente no App Router, preserva a URL unica de compartilhamento, reduz complexidade de produto e evita persistencia de assets;
- contras: exige cuidado para nao duplicar transformacoes de dados entre a tela HTML e a imagem.

### 2) Shared view model unico para pagina e imagem

- pros: centraliza transformacao de dados e reduz divergencia de contrato;
- contras: arrisca acoplar necessidades de renderizacao HTML e OG cedo demais.

### 3) Rota publica separada para share

- pros: isola o fluxo de compartilhamento e abre espaco para customizacoes futuras;
- contras: adiciona outra URL publica sem necessidade para este MVP e duplica surface area de manutencao.

## Arquitetura proposta

### Limites e unidades

- `src/app/result/[submissionId]/page.tsx`
  - passa a expor `generateMetadata` em vez de metadata estatica;
  - continua responsavel por renderizar a pagina HTML do resultado.
- `src/app/result/[submissionId]/opengraph-image.tsx`
  - rota de imagem OG do App Router;
  - renderiza um PNG via `Takumi` a partir de um componente React dedicado.
- `src/app/result/[submissionId]/result-metadata.ts` ou modulo equivalente
  - concentra a montagem de `title`, `description`, `openGraph` e `twitter`;
  - nao conhece detalhes de layout visual da imagem.
- `src/app/result/[submissionId]/result-share-view-model.ts` ou modulo equivalente
  - transforma o payload persistido em contrato minimo para a imagem;
  - expoe apenas os campos necessarios ao embed.
- `src/app/result/[submissionId]/get-result-share-source.ts` ou modulo equivalente
  - expoe uma interface unica e nomeada, por exemplo `getResultShareSource(submissionId)`;
  - centraliza a leitura do roast para `page`, `generateMetadata` e `opengraph-image`;
  - devolve um payload unico com status e dados normalizados, evitando duplicacao de regras de elegibilidade.

Cada unidade fica com uma responsabilidade unica: buscar dados, montar metadata, transformar payload para share e renderizar imagem. Isso permite evoluir o share no futuro sem acoplar a imagem ao componente HTML da pagina.

## Contrato visual da imagem

### Campos do embed

O layout da imagem deve usar somente:

- `score`;
- `verdict`;
- `language`;
- `lineCount`;
- `headline`.

### Contrato do share view model

| Campo | Origem | Fallback | Regra |
|-------|--------|----------|-------|
| `score` | `roast_results.score` | sem fallback | inteiro exibido em destaque principal |
| `verdict` | `roast_results.verdict` | sem fallback | texto curto exibido abaixo do score |
| `language` | `submissions.language` | `unknown` | exibido como `lang: <valor>` |
| `lineCount` | `submissions.lineCount` | `0` | exibido como `<n> lines` |
| `headline` | `roast_results.headline` | `"This code woke up the linter."` | frase principal do card |

### Fonte de verdade visual

O design de referencia e o frame `Screen 4 - OG Image` selecionado no Pencil dentro do arquivo `devroast.pen`. O MVP deve preservar os elementos centrais vistos nesse frame:

- marca `> devroast` no topo;
- score em destaque visual dominante;
- label do verdict abaixo do score;
- metadata tecnica curta (`lang` e quantidade de linhas);
- headline centralizada como frase de efeito final.

### Regras de composicao

- tamanho da imagem segue padrao Open Graph amplo (`1200x630`);
- a hierarquia visual deve permanecer equivalente ao frame aprovado, mesmo que pequenos ajustes tecnicos sejam necessarios na traducao para JSX/CSS inline do `Takumi`;
- `headline` deve ocupar no maximo `2` linhas com ellipsis visual ao exceder esse limite;
- `verdict` deve permanecer em `1` linha; se vier maior que o espaco previsto, cortar com ellipsis;
- `language` deve permanecer em `1` linha dentro do bloco tecnico; se necessario, truncar com ellipsis;
- se `language` estiver ausente, usar `unknown` no bloco tecnico para manter consistencia com a pagina.

## Fluxo de dados

1. Crawler ou usuario acessa `result/[submissionId]`.
2. `generateMetadata` resolve o `submissionId` e consulta os dados do roast.
3. Se o roast estiver `completed`, a metadata monta `title`, `description` e `openGraph.images` apontando para a rota OG correspondente.
4. Quando o crawler requisita a imagem, a rota `opengraph-image.tsx` consulta o mesmo resultado persistido.
5. O payload e reduzido para o `share view model`.
6. O componente da imagem renderiza o card usando `Takumi` e responde o binario com cache HTTP.

## Metadata e comportamento de share

- a pagina `result/[submissionId]` torna-se a unica URL de compartilhamento;
- `title` segue o template `DevRoast | <verdict> <score>/10`;
- `description` segue o template `<headline> lang: <language> - <lineCount> lines`;
- `openGraph.images` e `twitter.images` devem apontar para a imagem gerada no mesmo segmento da rota;
- `title` e `description` devem refletir o roast concluido, sem depender de texto generico do app;
- quando o resultado nao estiver `completed` ou nao for encontrado, a pagina nao promove imagem especifica de roast neste ciclo e cai para metadata default simples do produto.

## Cache e performance

- a imagem sera gerada sob demanda, nao precomputada;
- a rota OG deve usar `revalidate = 3600` como padrao inicial, equilibrando custo e rapidez de propagacao;
- a resposta da imagem deve enviar `Cache-Control: public, max-age=3600, stale-while-revalidate=86400` para crawlers e acessos repetidos;
- carregamento de fontes do `Takumi` deve ser encapsulado e cacheado em memoria de modulo sempre que possivel, evitando fetch/leitura repetitiva por requisicao.

## Integracao com Takumi

- usar `@takumi-rs/image-response` como gerador da resposta da imagem;
- retornar `ImageResponse` a partir de um componente React dedicado a OG image;
- formato preferencial: `png` para compatibilidade ampla com embeds;
- fontes devem ser explicitamente carregadas para a renderizacao, em vez de depender de system fonts;
- a implementacao deve priorizar carregar `JetBrains Mono` a partir do mesmo asset/font source usado pelo app, com fallback tecnico documentado caso o runtime da OG nao consiga reutilizar diretamente o asset atual;
- a imagem nao reaproveita diretamente componentes Tailwind da pagina, porque o `Takumi` trabalha melhor com arvore JSX e estilos inline controlados.

## Erros e resiliencia

- se o `submissionId` for invalido, a page continua com o comportamento atual de `notFound()`;
- se a consulta do resultado nao encontrar roast, a metadata nao deve quebrar a pagina e a rota de imagem deve responder `notFound()`;
- se o roast existir, mas nao estiver `completed`, a metadata nao expoe imagem especifica de share neste MVP;
- se a rota de imagem receber um roast existente, mas nao `completed`, ela tambem deve responder `notFound()` para nao publicar embed inconsistente;
- falhas de geracao da imagem nao devem alterar o estado persistido da submissao, pois a feature e derivada apenas de leitura.

## Estrutura sugerida de arquivos

- `src/app/result/[submissionId]/page.tsx`
- `src/app/result/[submissionId]/opengraph-image.tsx`
- `src/app/result/[submissionId]/result-share-view-model.ts`
- `src/app/result/[submissionId]/result-metadata.ts`

Os nomes exatos podem variar, desde que a separacao entre page, metadata, mapper e imagem seja preservada.

## Fora de escopo

- imagens especificas para estados `processing` ou `failed`;
- nova rota publica `/share/[submissionId]`;
- persistencia de imagem em storage externo;
- uso de `publicId` ou slug separado para compartilhamento;
- inclusao de trecho de codigo, diff ou analise detalhada no embed;
- edicao visual do design no navegador durante esta etapa.

## Criterios de aceite

- compartilhar a URL `result/[submissionId]` de um roast `completed` expoe metadata Open Graph com imagem especifica do resultado;
- a imagem e gerada automaticamente com `Takumi` e segue a composicao do frame `Screen 4 - OG Image`;
- o embed usa apenas `score`, `verdict`, `language`, `lineCount` e `headline`;
- resultados nao concluidos nao entram no fluxo de imagem personalizada neste ciclo;
- a geracao da imagem utiliza cache HTTP/revalidate para evitar custo repetido desnecessario;
- `npm run format`, `npm run lint` e `npm run build` permanecem como validacoes obrigatorias na fase de implementacao.
