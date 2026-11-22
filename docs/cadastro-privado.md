# Cadastro privado de peças com Google

O Worker recebe o retorno do Google via OpenID Connect e troca o código no servidor usando PKCE. Confere state, nonce, assinatura RS256, emissor, audiência, expiração e e-mail verificado. Só a conta em ARTIST_EMAIL recebe uma sessão assinada de uma hora. Para fixar também o ID permanente da conta Google, configure ARTIST_GOOGLE_SUB. A sessão vai em um cookie Secure, HttpOnly e SameSite=Lax, restrito ao domínio do painel. O Worker valida a sessão nas rotas de gestão, na API e nas fotos privadas. O Worker só inicia login na origem HTTPS configurada. Nenhum token de acesso do Google é armazenado.

A tela não aceita senhas. O Google protege a entrada da conta. Configure a verificação em duas etapas ou uma passkey na conta da artista; o Worker não confirma qual fator foi usado no Google. O Worker exige mesma origem para gravações, usa parâmetros SQL e limita o tamanho de requisições e fotos. Pela interface, a foto é regravada como JPEG reduzido, removendo metadados do original. O cadastro e a foto ficam no D1. A consulta pública só lê peças publicadas e suas fotos. Respostas da gestão usam no-store.

## Preparar o Google Cloud

1. Em Google Cloud Console, abra Google Auth Platform e configure Branding, Audience e Data Access. Para testar com uma conta Google pessoal, selecione External e adicione o e-mail da artista em Test users, se a tela de teste solicitar. Os únicos escopos pedidos pelo Worker são openid e email.
2. Em Clients, crie um OAuth client do tipo Web application. Em Authorized redirect URIs, cadastre exatamente https://previa.galarzaatelie.com.br/gestao/google/retorno. Anote o Client ID e guarde o Client Secret para cadastrar diretamente na Cloudflare.

## Publicar a prévia na Cloudflare

O arquivo wrangler.preview.jsonc aponta para o banco D1 da prévia. Use o Wrangler autenticado na conta correta e confirme o banco antes da migração.

    pnpm install --frozen-lockfile
    pnpm run build
    pnpm dlx wrangler@4.166.0 login
    pnpm dlx wrangler@4.166.0 d1 migrations apply galarza-catalogo-preview --remote --config wrangler.preview.jsonc
    pnpm dlx wrangler@4.166.0 deploy --config wrangler.preview.jsonc

Em Workers & Pages → galarza-catalogo-preview → Settings → Variables and Secrets, configure:

| Nome | Tipo | Valor |
| --- | --- | --- |
| ADMIN_ORIGIN | Variável | https://previa.galarzaatelie.com.br, sem barra final |
| GOOGLE_CLIENT_ID | Variável | Client ID do aplicativo Web no Google |
| GOOGLE_CLIENT_SECRET | Secret | Client Secret do aplicativo Web no Google |
| ARTIST_EMAIL | Secret | E-mail exato da conta Google da artista |
| SESSION_SECRET | Secret | Chave aleatória de pelo menos 32 bytes. Gere, por exemplo, com node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))". |

Cadastre os segredos diretamente no painel. Sem a configuração completa, o Worker bloqueia o acesso privado. Cloudflare Zero Trust e Access são dispensáveis neste fluxo.

Abra https://previa.galarzaatelie.com.br/gestao no celular. Entre com a conta da artista, salve um rascunho com foto, confira em janela anônima que os dados e a foto ainda estão privados, e publique. Veja o link público em outra sessão. Confirme que uma segunda conta Google não entra. As políticas e a autenticação real do Google precisam ser verificadas nessa etapa.

## Preparar a produção

A main publica automaticamente. Antes de integrar, configure o banco D1 de produção, aplique as migrações nesse banco e crie credenciais OAuth separadas com a URL de retorno do domínio oficial. Configure ADMIN_ORIGIN e os segredos no Worker oficial. Teste com a artista na prévia antes de enviar alterações a main.

Referência oficial: https://developers.google.com/identity/openid-connect/openid-connect
