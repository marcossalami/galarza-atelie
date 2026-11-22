const cookieName = "__Host-galarza-admin";
const sessionSeconds = 3600;
const windowSeconds = 300;
const maxAttempts = 10;
const text = new TextEncoder();
const headers = {
  "Cache-Control": "no-store",
  "Referrer-Policy": "same-origin",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
};

function configured(url, env) {
  return url.protocol === "https:" && url.origin === env.ADMIN_ORIGIN &&
    env.CATALOG_DB && /^[a-f0-9]{64}$/.test(env.ADMIN_PASSWORD_HASH ?? "");
}

async function digest(value) {
  return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", text.encode(value))),
    (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function matchesDigest(left, right) {
  let difference = 0;
  for (let i = 0; i < 64; i++) difference |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return difference === 0;
}

function sessionToken(request) {
  const token = request.headers.get("Cookie")?.split(";").map((part) => part.trim())
    .find((part) => part.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1);
  return /^[a-f0-9]{64}$/.test(token ?? "") ? token : null;
}

function cookie(token, age) {
  return `${cookieName}=${token}; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=${age}`;
}

function redirect(cookies) {
  return new Response(null, { status: 303, headers: { ...headers, Location: "/gestao", "Set-Cookie": cookies } });
}

export function loginPage(url, env, { status = 200, message = "" } = {}) {
  if (!configured(url, env)) {
    return new Response("Gestão ainda não configurada.", { status: 503, headers });
  }
  const responseHeaders = {
    ...headers,
    "Content-Type": "text/html; charset=utf-8",
    "Content-Security-Policy": "default-src 'none'; style-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
  };
  if (status === 429) responseHeaders["Retry-After"] = String(windowSeconds);
  return new Response(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Painel | Galarza Ateliê</title>
    <link rel="stylesheet" href="/gestao-login.css"></head><body>
    <main><p>Galarza Ateliê</p><h1>Entrar no painel</h1>
    ${message ? `<p role="alert">${message}</p>` : ""}
    <form action="/gestao/entrar" method="post">
      <label>Usuário<input name="usuario" autocomplete="username" required maxlength="32" autocapitalize="none"></label>
      <label>Senha<input type="password" name="senha" autocomplete="current-password" required maxlength="64"></label>
      <button type="submit">Entrar</button>
    </form></main></body></html>`, { status, headers: responseHeaders });
}

export async function authorized(request, url, env) {
  if (!configured(url, env)) return false;
  const token = sessionToken(request);
  if (!token) return false;
  const entry = await env.CATALOG_DB.prepare(
    "SELECT 1 AS ok FROM admin_sessions WHERE digest = ? AND credential = ? AND expires > ?",
  ).bind(await digest(token), await digest(env.ADMIN_PASSWORD_HASH), Math.floor(Date.now() / 1000)).first();
  return Boolean(entry);
}

async function readLogin(request) {
  const reader = request.body?.getReader();
  if (!reader) return null;
  const decoder = new TextDecoder();
  let body = "";
  let bytes = 0;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) return new URLSearchParams(body + decoder.decode());
    bytes += value.byteLength;
    if (bytes > 1024) {
      await reader.cancel();
      return null;
    }
    body += decoder.decode(value, { stream: true });
  }
}

export async function authRoute(request, url, env) {
  if (!configured(url, env)) return loginPage(url, env);
  if (request.method !== "POST" || request.headers.get("Origin") !== url.origin) {
    return new Response("Solicitação rejeitada.", { status: 403, headers });
  }
  const db = env.CATALOG_DB;
  if (url.pathname === "/gestao/sair") {
    const token = sessionToken(request);
    if (token) await db.prepare("DELETE FROM admin_sessions WHERE digest = ?").bind(await digest(token)).run();
    return redirect(cookie("", 0));
  }
  if (request.headers.get("Content-Type")?.split(";")[0] !== "application/x-www-form-urlencoded") {
    return new Response("Solicitação rejeitada.", { status: 415, headers });
  }
  const now = Math.floor(Date.now() / 1000);
  const slot = await db.prepare(`INSERT INTO admin_login_limit (id, expires, attempts) VALUES (1, ?, 1)
    ON CONFLICT(id) DO UPDATE SET
      attempts = CASE WHEN expires <= ? THEN 1 ELSE attempts + 1 END,
      expires = CASE WHEN expires <= ? THEN excluded.expires ELSE expires END
    WHERE expires <= ? OR attempts < ? RETURNING attempts`)
    .bind(now + windowSeconds, now, now, now, maxAttempts).first();
  if (!slot) return loginPage(url, env, { status: 429, message: "Muitas tentativas. Aguarde alguns minutos." });

  const form = await readLogin(request);
  const password = form?.get("senha") ?? "";
  const allowedFormat = env.ADMIN_ALLOW_TEMPORARY_PASSWORD === "true"
    ? /^[A-Za-z0-9_-]{12,32}$/.test(password)
    : /^[A-Za-z0-9_-]{32}$/.test(password);
  const valid = allowedFormat &&
    matchesDigest(await digest(password), env.ADMIN_PASSWORD_HASH);
  if (!valid || form?.get("usuario") !== "artista") {
    return loginPage(url, env, { status: 401, message: "Usuário ou senha inválidos." });
  }
  const token = Array.from(crypto.getRandomValues(new Uint8Array(32)),
    (byte) => byte.toString(16).padStart(2, "0")).join("");
  await db.batch([
    db.prepare("DELETE FROM admin_sessions WHERE expires <= ?").bind(now),
    db.prepare("INSERT INTO admin_sessions (digest, credential, expires) VALUES (?, ?, ?)")
      .bind(await digest(token), await digest(env.ADMIN_PASSWORD_HASH), now + sessionSeconds),
  ]);
  return redirect(cookie(token, sessionSeconds));
}
