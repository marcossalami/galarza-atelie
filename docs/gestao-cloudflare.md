# Gestão de peças na Cloudflare

A artista usa o usuário `artista` em `/gestao`. O Worker valida a senha no servidor, cria uma sessão de uma hora em cookie Secure, HttpOnly e SameSite=Strict e confirma essa sessão no D1 para cada solicitação privada. Sair revoga a sessão. Alterar a senha invalida as sessões da senha anterior. As gravações precisam vir da origem HTTPS configurada. A API pública só lê peças já publicadas e suas fotos.

O D1 reserva atomicamente cada tentativa de login antes da validação, com até dez tentativas em cinco minutos para o painel inteiro. Um ataque ainda pode causar um bloqueio temporário do painel. A vitrine pública fica disponível.

## Ativar a senha da artista

Em um terminal local com Node, gere uma senha aleatória de 24 bytes com seu hash. Use a senha gerada pelo comando, que tem 192 bits de entropia. O verificador SHA-256 deste sistema foi escolhido para essa credencial aleatória. Senhas escolhidas manualmente exigiriam um esquema de derivação diferente.

```powershell
node -e "const c=require('node:crypto'); const p=c.randomBytes(24).toString('base64url'); console.log('Senha: '+p); console.log('Hash: '+c.createHash('sha256').update(p).digest('hex'))"
```

Guarde a senha em um gerenciador de senhas e compartilhe com a artista por um canal privado. No Worker da Cloudflare, abra **Settings → Variables and Secrets** e salve somente o hash como `ADMIN_PASSWORD_HASH` do tipo **Secret**.

Antes de publicar, aplique as migrações no D1 vinculado ao Worker e defina `ADMIN_ORIGIN` como o endereço HTTPS exato do painel, sem barra final. Em prévia, use `wrangler.preview.jsonc`, que aponta para um Worker e um banco separados. O Worker deixa a gestão indisponível até que o hash e a origem estejam configurados.

```powershell
pnpm run build
pnpm dlx wrangler@4.166.0 d1 migrations apply galarza-catalogo-preview --remote --config wrangler.preview.jsonc
pnpm dlx wrangler@4.166.0 deploy --config wrangler.preview.jsonc
```
