# Galarza Ateliê — site independente

Este é um site Vite estático, pronto para ser hospedado no Cloudflare Pages. Não usa API, banco de dados, checkout, analytics ou serviços do ChatGPT.

## Publicação no Cloudflare Pages

1. Crie uma conta gratuita no Cloudflare.
2. Adicione `galarzaatelie.com.br` como site/zona e troque, no Registro.br, os servidores DNS pelos dois nameservers informados pelo Cloudflare.
3. No Cloudflare, abra **Workers & Pages** e crie um projeto Pages por upload direto.
4. Gere a pasta `dist` com `npm install` e `npm run build`; envie o conteúdo de `dist` no projeto Pages.
5. Em **Custom domains**, adicione `galarzaatelie.com.br` e `www.galarzaatelie.com.br`.
6. Crie uma regra de redirecionamento de `www` para `galarzaatelie.com.br`.

Os cabeçalhos de segurança estão em `public/_headers` e são publicados junto com o site.
