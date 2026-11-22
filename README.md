# Galarza Ateliê — site independente

Este é um site Vite estático, pronto para ser hospedado no Cloudflare Pages. Não usa API, banco de dados, checkout, analytics ou serviços do ChatGPT.

As decisões confirmadas do produto e os pontos que ainda dependem da artista
estão em [docs/briefing.md](docs/briefing.md).

## Atualizar peças disponíveis

Nesta entrega, atualize o catálogo diretamente em `src/content/catalog.js`.
Só marque uma peça como `status: "available"` após confirmar o estoque e
preencher `priceInCents` com o preço em centavos. Por exemplo, 12500 equivale a
R$ 125,00. Cadastre nome, formato, foto e texto alternativo. Quando tiver os
dados, informe `measurements`, `capacity` e `photos` (cada foto com `image` e `alt`).

Marque uma peça vendida como `status: "sold"`. Ela sai da home e seu link
continua funcionando com o aviso de venda e acesso às referências. A galeria
é uma seleção de trabalhos anteriores. Uma foto no acervo não indica estoque.

O sistema visual e a decisão atual sobre o feed do Instagram estão registrados
em [docs/design-system.md](docs/design-system.md) e
[docs/instagram-feed-decision.md](docs/instagram-feed-decision.md).

## Publicação no Cloudflare Workers

1. Crie uma conta gratuita no Cloudflare.
2. Adicione `galarzaatelie.com.br` como site/zona e troque, no Registro.br, os servidores DNS pelos dois nameservers informados pelo Cloudflare.
3. No repositório GitHub, crie os secrets de ambiente `production`: `CLOUDFLARE_API_TOKEN` (com permissão de editar Workers) e `CLOUDFLARE_ACCOUNT_ID`.
4. O workflow [deploy.yml](.github/workflows/deploy.yml) testa, gera a pasta `dist` e publica no Worker `cold-bread-d52c` a cada push aprovado na branch `main`. Para publicar manualmente, use `pnpm run deploy` com as mesmas variáveis de ambiente.
5. Mantenha `galarzaatelie.com.br` como domínio personalizado do Worker no Cloudflare. HTTPS é servido pela zona do domínio depois que a configuração de DNS estiver ativa.

Os cabeçalhos de segurança estão em `public/_headers` e são publicados junto com o site.
