# Cadastro privado de peças

A área `/gestao` usa Cloudflare Access como porta de entrada. O Worker exige também um JWT válido em cada acesso à página, à API e às fotos privadas. Ele verifica a assinatura RS256 com as chaves oficiais da equipe, o emissor, a audiência da aplicação, a expiração e o e-mail autorizado. Configuração ausente ou token inválido gera acesso negado.

O site não recebe senhas ou códigos de login. Para proteção contra força bruta, use um provedor de identidade com passkey ou MFA obrigatório e bloqueio de tentativas, e permita no Access apenas a conta da artista. Use sessão curta e mantenha o provedor de identidade como método de login autorizado para a aplicação. Desative o acesso direto pelo subdomínio `workers.dev` e por URLs de preview em produção se não forem usados.

O Worker exige mesma origem para gravações, usa parâmetros SQL e limita o tamanho das requisições e das fotos. Pela interface, a foto é regravada em JPEG em tamanho reduzido, removendo metadados do arquivo original. A API aceita somente JPEG e serve sempre com MIME fixo e `nosniff`. D1 guarda o cadastro e a foto juntos. A API pública só consulta registros publicados, inclusive para fotos. Respostas do cadastro usam `no-store`. Nenhum rascunho integra o build estático.

## Ativar no ambiente de prévia

1. No painel, confirme que `previa.galarzaatelie.com.br` está livre na zona do domínio. Em **Storage & databases → D1**, crie `galarza-catalogo-preview`. Copie seu ID para `database_id`, junto de `database_name`, na cópia de `wrangler.preview.jsonc` que vai usar para publicar. Confira se a conta e o nome exibidos pelo Wrangler são os da prévia.
2. Em **Zero Trust → Access controls → Applications**, crie uma aplicação self-hosted. Adicione `previa.galarzaatelie.com.br/gestao`, `previa.galarzaatelie.com.br/gestao/*` e `previa.galarzaatelie.com.br/api/gestao/*` à mesma aplicação, para usarem a mesma audiência. Use uma política **Allow** com o e-mail exato da artista, sessão curta (por exemplo, uma hora) e MFA obrigatório por Access ou pelo provedor configurado. Use um provedor com limitação de tentativas e confira que as rotas públicas continuam abertas.
3. Defina no Worker `ACCESS_TEAM_URL` com a URL HTTPS da equipe em `cloudflareaccess.com`, `ACCESS_AUD` com a audiência da aplicação e `ARTIST_EMAIL` com a conta autorizada. Mantenha esses valores na configuração do Worker.
4. Com o Wrangler autenticado na conta correta, aplique a migração e publique a prévia usando os comandos abaixo. A primeira publicação cria o Worker `galarza-catalogo-preview`; se ele ainda não existia quando você chegou ao passo 3, cadastre as variáveis no painel logo depois. Até lá, o Worker rejeita acesso privado.
5. Pelo celular, entre em `/gestao`, salve um rascunho com foto e confira o cartão. Em uma sessão anônima, confirme o bloqueio da gestão, da API privada e da foto privada. Confirme que o link público do rascunho está indisponível. Publique e confirme em sessão anônima que o detalhe e a foto agora abrem.
6. Confirme que uma segunda identidade permanece bloqueada e valide o MFA e as políticas de tentativas no provedor antes de ativar em produção. A configuração e os testes no ambiente de prévia antecedem qualquer publicação no domínio oficial.

```powershell
pnpm install --frozen-lockfile
pnpm run build
pnpm dlx wrangler@4.166.0 login
pnpm dlx wrangler@4.166.0 d1 migrations apply galarza-catalogo-preview --remote --config wrangler.preview.jsonc
pnpm dlx wrangler@4.166.0 deploy --config wrangler.preview.jsonc
```

## Preparar a produção

O workflow atual publica em produção a cada push para `main`. Antes de integrar esta mudança à branch, crie o banco D1 de produção, confirme a vinculação `CATALOG_DB` ao ID do banco correto e execute `pnpm dlx wrangler@4.166.0 d1 migrations apply galarza-catalogo --remote` com a configuração de produção. O workflow atual faz o deploy do Worker. A migração é uma etapa prévia. Confira também a política do Access no domínio oficial e as permissões necessárias do token de deploy. Depois de publicar, repita a verificação anônima e o acesso da artista no domínio oficial.

Referências oficiais: [validação de JWT](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/) e [Cloudflare Access para Workers](https://developers.cloudflare.com/workers/configuration/cloudflare-access/).
