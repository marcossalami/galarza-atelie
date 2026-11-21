# Galarza Ateliê — site independente

Este é um site Vite estático, pronto para ser hospedado no Cloudflare Pages. Não usa API, banco de dados, checkout, analytics ou serviços do ChatGPT.

As decisões confirmadas do produto e os pontos que ainda dependem da artista
estão em [docs/briefing.md](docs/briefing.md).

## Publicação no Cloudflare Workers

1. Crie uma conta gratuita no Cloudflare.
2. Adicione `galarzaatelie.com.br` como site/zona e troque, no Registro.br, os servidores DNS pelos dois nameservers informados pelo Cloudflare.
3. No Cloudflare, abra **Workers & Pages**, selecione o Worker `cold-bread-d52c` e, em **Settings → Builds**, conecte este repositório GitHub à branch `main`.
4. Use `npm run build` como comando de build e `npx wrangler deploy` como comando de deploy. O `wrangler.jsonc` publica a pasta `dist` no Worker existente.
5. Mantenha `galarzaatelie.com.br` como domínio personalizado do Worker. Cada push em `main` deve iniciar um novo deploy automaticamente.

Os cabeçalhos de segurança estão em `public/_headers` e são publicados junto com o site.
