# Sistema visual — Galarza Ateliê

## Intenção

O site combina a calma do fazer manual com pequenos atritos gráficos: áreas de
cor chapada, tipografia de alto contraste, textura de papel e movimento lento.
As peças são o elemento mais colorido da página; a interface deve enquadrá-las,
e não competir com elas.

## Tokens

Na vitrine redesenhada, os tokens estão declarados no contêiner
`.storefront` em `src/components/storefront.css`. A paleta definida para
essa entrega usa off-white, preto, verde sálvia e lilás. As páginas
anteriores ainda usam os tokens de `src/styles/base.css`.

| Token | Uso |
| --- | --- |
| `--paper` | fundo principal e superfícies claras |
| `--warm` | contraste quente em fundos escuros |
| `--ink` | texto e fundos de maior peso |
| `--sage` | processo e áreas contemplativas |
| `--lilac` | encomendas e chamadas editoriais |

## Tipografia e composição

- Títulos usam serif e podem usar itálico para uma palavra de ênfase.
- Textos corridos usam sans-serif, tamanho mínimo de 14 px e entrelinha de ao
  menos 1.45.
- O espaçamento é amplo em desktop e reduzido no breakpoint de 700 px.
- Links de texto são sublinhados por uma borda; botões têm fundo sólido.

## Movimento e acessibilidade

- Animações devem ser discretas e nunca necessárias para compreender o
  conteúdo.
- A mídia `prefers-reduced-motion` reduz todas as animações.
- Imagens de peça têm texto alternativo descritivo; imagens decorativas usam
  `aria-hidden`.
- Layouts devem ser verificados em 320 px, 390 px e desktop, sem rolagem
  horizontal ou sobreposição de conteúdo.
