# Especificacao: editor com syntax highlight na homepage

## Contexto

O `DevRoast` hoje possui um editor visual simples na homepage, baseado em `textarea`, com numeracao de linhas calculada no client. O projeto ja usa `shiki` e tem um `CodeBlock` server-side em `src/components/ui/code-block.tsx`, mas ainda nao existe uma experiencia de edicao com syntax highlight em tempo real.

Objetivo desta feature:

- permitir que o usuario cole ou digite codigo na homepage;
- aplicar syntax highlight automaticamente;
- detectar a linguagem automaticamente;
- permitir selecao manual da linguagem no editor;
- manter a experiencia leve, rapida e coerente com a proposta static-first do produto.

## Resumo executivo

### Recomendacao

A melhor abordagem para o `DevRoast` neste momento e:

1. manter um editor leve baseado em `textarea`;
2. renderizar o highlight em uma camada visual sincronizada por cima/baixo do `textarea`;
3. usar `Shiki` como motor oficial de colorizacao;
4. usar auto-deteccao heuristica separada;
5. expor um seletor manual de linguagem com opcao `Auto`.

Em outras palavras: seguir a ideia central do `ray.so`, mas adaptada ao stack e ao escopo do `DevRoast`.

### Decisao sugerida

- `UI de edicao`: `textarea` sobreposto a uma camada destacada
- `Highlight`: `shiki` no browser, com linguagens carregadas sob demanda
- `Auto-detect`: `highlight.js` apenas para inferencia de linguagem, restrita a um subconjunto suportado
- `Override manual`: combobox/select no cabecalho do editor
- `Fallback`: `plaintext` quando a confianca for baixa ou o trecho for ambiguo

## Por que esta abordagem e a melhor para o DevRoast

- o produto nao precisa de IDE completa, autocomplete, diagnostics ou LSP neste momento;
- o editor fica na homepage, entao peso de bundle e tempo de interacao importam muito;
- o repositorio ja usa `shiki`, reduzindo custo tecnico e mantendo consistencia visual;
- o layout atual ja se encaixa bem no padrao `textarea + camada highlighted`;
- a experiencia desejada e mais proxima de "editor bonito para input" do que de "ambiente de desenvolvimento".

## Estudo das opcoes

## 1) Shiki + textarea sobreposto (recomendado)

### Como funciona

- o `textarea` continua sendo a origem da edicao;
- uma camada de apresentacao renderiza o codigo tokenizado;
- ambas compartilham fonte, espacamento, `line-height`, `tab-size`, `padding` e scroll;
- o texto real do `textarea` fica transparente, deixando visivel apenas o caret e a selecao;
- o highlight e recalculado conforme o usuario digita ou cola codigo.

### Pontos fortes

- excelente qualidade visual de highlight;
- alta fidelidade de temas e gramaticas;
- reaproveita dependencia ja presente no projeto;
- encaixa muito bem no estilo do `ray.so`;
- menor peso e complexidade do que Monaco;
- controle total do markup e da interface.

### Pontos fracos

- exige sincronizacao manual de scroll, altura, selecao e quebra de linha;
- nao entrega recursos de editor avancado por padrao;
- auto-deteccao nao e responsabilidade nativa do Shiki.

### Quando faz sentido

- homepage;
- formularios com input de codigo;
- experiencias focadas em visualizacao + edicao simples;
- produtos que precisam de UX bonita sem virar uma IDE.

## 2) CodeMirror 6

### Pontos fortes

- editor maduro e extensivel;
- melhor experiencia de edicao real do que `textarea` puro;
- troca de linguagem por extensoes;
- melhor base caso o produto evolua para atalhos, selecao complexa, folding ou decoracoes mais ricas.

### Pontos fracos

- mais complexo para compor visualmente no estilo atual;
- adiciona mais peso conceitual e de implementacao;
- para reproduzir a identidade do `ray.so`, ainda haveria trabalho de customizacao;
- a colorizacao padrao nao bate exatamente com a qualidade visual do Shiki.

### Veredito

Boa opcao se o roadmap ja preve autocomplete, plugins, lint inline ou edicao mais poderosa. Para o escopo atual, parece acima do necessario.

## 3) Monaco Editor

### Pontos fortes

- experiencia mais completa;
- ecossistema muito forte;
- excelente para editor tipo VS Code embutido.

### Pontos fracos

- pesado para uma homepage;
- demanda mais cuidado com workers, carregamento e bundle;
- visual e interacao tendem a puxar o produto para uma IDE;
- excesso de capacidade para a necessidade atual.

### Veredito

Nao recomendado para a primeira versao desta feature no `DevRoast`.

## 4) react-simple-code-editor

### Pontos fortes

- leve;
- modelo semelhante ao padrao overlay;
- oferece alguns comportamentos uteis como tab indentation.

### Pontos fracos

- adiciona uma abstracao extra onde o projeto consegue implementar internamente com pouco codigo;
- normalmente e usado com Prism, o que criaria duplicidade conceitual com o Shiki;
- menos alinhado ao stack atual do que uma solucao propria sobre `textarea`.

### Veredito

Aceitavel, mas eu nao adotaria. A combinacao `textarea proprio + shiki + deteccao separada` tende a dar mais controle e menos dependencia.

## Aprendizados do ray.so

Analisando o codigo aberto do `ray.so`, os pontos mais relevantes sao:

- o editor e baseado em `textarea`, nao em Monaco ou CodeMirror;
- o highlight e renderizado em uma camada separada (`HighlightedCode`), usando `Shiki`;
- a linguagem pode ser escolhida manualmente;
- existe modo `Auto-Detect`;
- a deteccao automatica e feita com `highlight.js` (`highlightAuto`), nao com `Shiki`;
- as linguagens do Shiki sao carregadas sob demanda;
- o layout depende de sincronismo fino entre `textarea` e camada formatada;
- o editor trata atalhos como `Tab`, `Shift+Tab`, `Enter` com indentacao preservada e alguns comportamentos manuais de chaves.

### Conclusao sobre o ray.so

O `ray.so` valida exatamente a arquitetura que melhor combina com o `DevRoast`: editor leve de entrada + camada rica de apresentacao. A principal adaptacao necessaria aqui e reduzir a complexidade para o que a homepage realmente precisa.

## Arquitetura recomendada para implementacao

## Fluxo funcional

1. usuario cola ou digita codigo;
2. o estado `code` e atualizado;
3. uma rotina de deteccao tenta inferir a linguagem;
4. se o usuario estiver em modo `Auto`, a linguagem ativa passa a ser a detectada;
5. se o usuario escolher uma linguagem manualmente, o valor detectado deixa de mandar no highlight;
6. a camada highlighted re-renderiza com `Shiki`;
7. se a deteccao falhar, usar `plaintext`.

## Modelo de estado sugerido

- `code: string`
- `languageMode: "auto" | "manual"`
- `detectedLanguage: SupportedLanguage | "plaintext"`
- `selectedLanguage: SupportedLanguage | null`
- `activeLanguage: SupportedLanguage | "plaintext"`
- `isDetectingLanguage: boolean`
- `isHighlighting: boolean`

Regra:

- `activeLanguage = languageMode === "manual" && selectedLanguage ? selectedLanguage : detectedLanguage`

## Estrutura de componentes sugerida

- `src/app/_components/home-code-editor.tsx`
  - componente orquestrador da homepage
- `src/app/_components/home-code-editor-language-select.tsx`
  - seletor manual com opcao `Auto`
- `src/components/ui/code-input.tsx`
  - primitive composta para `textarea + highlighted layer + gutter`
- `src/lib/code-highlight/`
  - utilitarios de linguagem, mapa de aliases, deteccao e highlight

## Modulos sugeridos

### `src/lib/code-highlight/languages.ts`

- lista fechada de linguagens suportadas no MVP;
- label amigavel;
- id interno;
- aliases;
- id do `Shiki`;
- id/subset do `highlight.js`.

### `src/lib/code-highlight/detect-language.ts`

- usa `highlight.js` via `highlightAuto(code, subset)`;
- restringe deteccao a um conjunto pequeno e util para o produto;
- aplica normalizacao de aliases (`js -> javascript`, `ts -> typescript`, etc.);
- devolve `plaintext` quando a relevancia for baixa ou o input for curto demais.

### `src/lib/code-highlight/highlight-code.ts`

- encapsula `Shiki` no browser;
- carrega tema e linguagem sob demanda;
- memoriza highlighter/linguagens carregadas;
- devolve HTML ou HAST prontos para render.

## Linguagens recomendadas para o MVP

Comecar pequeno evita falso positivo na auto-deteccao e ajuda bundle/performance.

- `javascript`
- `typescript`
- `jsx`
- `tsx`
- `json`
- `bash`
- `python`
- `java`
- `go`
- `rust`
- `html`
- `css`
- `sql`
- `yaml`
- `markdown`
- `plaintext`

Depois, expandir conforme uso real.

## Estrategia de auto-deteccao

## Recomendacao pratica

- detectar apenas quando houver conteudo minimo, por exemplo 12 a 20 caracteres relevantes;
- aplicar `debounce` curto, por exemplo 120 a 200 ms;
- limitar o subconjunto de linguagens analisadas;
- usar `plaintext` como fallback;
- nao trocar a linguagem ativa enquanto o usuario estiver em modo manual;
- opcionalmente manter a ultima deteccao valida para evitar flicker entre linguagens proximas.

## Heuristicas adicionais recomendadas

Antes de chamar `highlight.js`, vale adicionar atalhos simples:

- se comeca com `{` ou `[` e `JSON.parse` localmente valida, priorizar `json`;
- se existe `</` e tags HTML claras, priorizar `html`;
- se existe `interface`, `type`, `implements`, `as const`, priorizar `typescript`;
- se existe `def ` e `:` de bloco consistente, priorizar `python`;
- se existe `SELECT`, `FROM`, `WHERE`, priorizar `sql`.

Essas heuristicas reduzem erros comuns em snippets curtos.

## UX recomendada

## Na homepage

- manter o visual terminal-like atual;
- mostrar o seletor de linguagem no header do editor ou abaixo dele;
- exibir badge discreto com `Auto: TypeScript`, `Manual: Python` ou `Plain text`;
- manter numeracao de linhas;
- preservar placeholder atual, mas agora com highlight quando houver texto real;
- manter CTA principal sem distrair do fluxo.

## Comportamentos de edicao recomendados para V1

- colar codigo com multiline sem quebrar layout;
- suporte a `Tab` para indentacao;
- suporte a `Shift+Tab` para outdent em selecao;
- preservar indentacao ao pressionar `Enter`;
- scroll sincronizado entre textarea e camada visual;
- `spellCheck={false}` e sem autocorrect/autocapitalize.

## Acessibilidade

- o elemento editavel real deve continuar sendo `textarea`;
- adicionar `label` ou `aria-label` claro;
- o seletor de linguagem precisa ser navegavel por teclado;
- modo `Auto` e modo manual devem ficar explicitamente anunciados no texto visivel ou para leitores de tela;
- manter contraste suficiente entre tokens e fundo.

## Performance

- carregar highlight apenas no client;
- lazy load de linguagens e tema do `Shiki`;
- usar cache em memoria para highlighter e linguagens ja carregadas;
- aplicar `debounce` no highlight quando o texto crescer muito;
- opcionalmente definir um limite de tamanho para highlight em tempo real, por exemplo 400 a 800 linhas;
- acima do limite, mostrar aviso e cair para modo degradado temporario.

## Riscos e mitigacoes

### Risco: auto-deteccao errada

- mitigar com subset pequeno, heuristicas iniciais e fallback para `plaintext`.

### Risco: desalinhamento visual entre texto e camada highlighted

- mitigar garantindo os mesmos valores de fonte, `letter-spacing`, `line-height`, `tab-size`, `padding` e `white-space` nas duas camadas.

### Risco: lag ao colar blocos grandes

- mitigar com debounce, cache e limite de linhas para realce ao vivo.

### Risco: bundle crescer demais

- mitigar carregando linguagens sob demanda e evitando Monaco nesta fase.

## Criterios de aceite

- usuario consegue colar ou digitar codigo na homepage;
- o codigo recebe syntax highlight em tempo real;
- a linguagem e detectada automaticamente em casos comuns do MVP;
- usuario consegue trocar para uma linguagem manualmente;
- ao selecionar manualmente, a auto-deteccao deixa de sobrescrever a escolha;
- `plaintext` e usado quando nao houver confianca suficiente;
- layout do editor continua fiel ao design atual;
- desktop e mobile funcionam sem quebra de layout;
- performance percebida continua boa para snippets comuns.

## Plano de implementacao sugerido

## Fase 1 - Fundacao

- criar mapa de linguagens suportadas;
- criar util de deteccao com `highlight.js`;
- criar util de highlight com `Shiki` no client;
- definir estrategia de cache/lazy load.

## Fase 2 - Primitive de editor

- extrair primitive `CodeInput`;
- implementar overlay entre `textarea` e camada highlighted;
- sincronizar line numbers, scroll e altura;
- suportar `Tab`, `Shift+Tab` e `Enter` com indentacao.

## Fase 3 - Homepage

- integrar o novo editor em `src/app/_components/home-code-editor.tsx`;
- adicionar seletor manual de linguagem;
- adicionar badge/estado visual de `Auto` vs `Manual`;
- revisar responsividade.

## Fase 4 - Qualidade

- validar snippets reais nas linguagens do MVP;
- testar colagem de blocos grandes;
- revisar acessibilidade por teclado;
- rodar `npm run format`, `npm run lint` e `npm run build`.

## To-dos

- [ ] Definir a lista final de linguagens do MVP
- [ ] Definir se o seletor manual ficara no header do editor ou abaixo dele
- [ ] Criar `languages.ts` com ids, labels e aliases
- [ ] Criar `detect-language.ts` com `highlight.js` e subset controlado
- [ ] Criar `highlight-code.ts` com cache e lazy load de `Shiki`
- [ ] Extrair uma primitive reutilizavel de input de codigo
- [ ] Implementar overlay com sincronizacao visual perfeita
- [ ] Implementar numeracao de linhas integrada ao novo editor
- [ ] Implementar seletor `Auto` / manual
- [ ] Implementar fallback de `plaintext`
- [ ] Adicionar debounce e protecao para trechos grandes
- [ ] Testar snippets JS, TS, TSX, JSON, Bash, Python, HTML e SQL
- [ ] Validar comportamento em mobile
- [ ] Validar acessibilidade por teclado e leitor de tela
- [ ] Rodar format, lint e build apos a implementacao

## O que eu faria agora

Se a implementacao comecasse hoje, eu seguiria esta ordem:

1. `Shiki + textarea overlay` como arquitetura base;
2. `highlight.js` apenas para auto-detect;
3. seletor manual com opcao `Auto` desde a V1;
4. subset pequeno de linguagens no MVP;
5. fallback forte para `plaintext` em casos ambiguos.

## Perguntas em aberto

Estas perguntas nao bloqueiam a especificacao, mas ajudam a fechar o escopo da implementacao:

1. o MVP deve priorizar linguagens do ecossistema web (`js`, `ts`, `tsx`, `json`, `html`, `css`, `bash`) ou uma cobertura mais ampla logo de inicio?
2. o seletor manual de linguagem deve ficar sempre visivel na homepage ou aparecer apenas apos o usuario colar/digitar codigo?
3. o editor precisa suportar highlight em tempo real para blocos muito grandes, ou podemos degradar a experiencia acima de um limite seguro?

## Referencias consultadas

- codigo aberto do `ray.so`, especialmente `Editor.tsx`, `HighlightedCode.tsx`, `LanguageControl.tsx`, `store/code.ts` e `util/languages.ts`
- documentacao do `Shiki` para uso em Next.js e browser/client rendering
- documentacao do `highlight.js` sobre `highlightAuto`
- documentacao do `CodeMirror 6`
- documentacao do `Monaco Editor`
- documentacao do `react-simple-code-editor`
