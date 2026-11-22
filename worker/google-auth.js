import { createRemoteJWKSet, jwtVerify, SignJWT } from "jose";

const googleKeys = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));
const session = "__Host-galarza-session";
const transaction = "__Host-galarza-login";
const callback = "/gestao/google/retorno";
const headers = {
  "Cache-Control": "no-store",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
};

function secret(env) {
  return new TextEncoder().encode(env.SESSION_SECRET ?? "");
}

function configured(url, env) {
  return url.protocol === "https:" && url.origin === env.ADMIN_ORIGIN &&
    env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.ARTIST_EMAIL && secret(env).length >= 32;
}

function cookie(request, name) {
  const value = request.headers.get("Cookie")?.split(";").map((item) => item.trim())
    .find((item) => item.startsWith(`${name}=`))?.slice(name.length + 1);
  return value && value.length <= 4096 ? value : null;
}

function setCookie(name, value, maxAge) {
  return `${name}=${value}; Max-Age=${maxAge}; Path=/; Secure; HttpOnly; SameSite=Lax`;
}

function redirect(location, cookies = []) {
  const response = new Response(null, { status: 303, headers: { ...headers, Location: location } });
  for (const value of cookies) response.headers.append("Set-Cookie", value);
  return response;
}

function error(message, status) {
  return new Response(message, {
    status,
    headers: { ...headers, "Content-Type": "text/plain; charset=utf-8" },
  });
}

function sign(payload, env, purpose, expiry) {
  return new SignJWT(payload).setProtectedHeader({ alg: "HS256" }).setIssuer(env.ADMIN_ORIGIN)
    .setAudience(purpose).setIssuedAt().setExpirationTime(expiry).sign(secret(env));
}

async function verify(token, env, purpose) {
  return (await jwtVerify(token, secret(env), {
    algorithms: ["HS256"], issuer: env.ADMIN_ORIGIN, audience: purpose, requiredClaims: ["exp", "iat"],
  })).payload;
}

function artist(email, sub, env) {
  return typeof email === "string" && email.toLowerCase() === env.ARTIST_EMAIL.toLowerCase() &&
    typeof sub === "string" && sub.length > 0 && (!env.ARTIST_GOOGLE_SUB || env.ARTIST_GOOGLE_SUB === sub);
}

export async function authorized(request, url, env) {
  if (!configured(url, env)) return false;
  const token = cookie(request, session);
  if (!token) return false;
  try {
    const { email, sub } = await verify(token, env, "catalog-admin");
    return artist(email, sub, env);
  } catch {
    return false;
  }
}

async function startLogin(url, env) {
  const state = crypto.randomUUID();
  const nonce = crypto.randomUUID();
  const verifier = crypto.randomUUID() + crypto.randomUUID();
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  const challenge = btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
  const login = await sign({ state, nonce, verifier }, env, "google-login", "10m");
  const target = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  target.search = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: new URL(callback, url).href,
    response_type: "code",
    scope: "openid email",
    prompt: "select_account",
    state, nonce, code_challenge: challenge, code_challenge_method: "S256",
  });
  return redirect(target.href, [setCookie(transaction, login, 600)]);
}

async function finishLogin(request, url, env) {
  const clear = setCookie(transaction, "", 0);
  try {
    const login = await verify(cookie(request, transaction), env, "google-login");
    const code = url.searchParams.get("code");
    if (login.state !== url.searchParams.get("state") || !code || code.length > 4096) throw Error();
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      body: new URLSearchParams({
        code, grant_type: "authorization_code", code_verifier: login.verifier,
        client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: new URL(callback, url).href,
      }),
      redirect: "error",
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw Error();
    const { id_token: token } = await response.json();
    const { payload } = await jwtVerify(token, googleKeys, {
      algorithms: ["RS256"],
      issuer: ["https://accounts.google.com", "accounts.google.com"],
      audience: env.GOOGLE_CLIENT_ID,
      requiredClaims: ["exp", "iat", "sub", "nonce", "email", "email_verified"],
    });
    if (payload.nonce !== login.nonce || payload.email_verified !== true ||
        (payload.azp && payload.azp !== env.GOOGLE_CLIENT_ID) ||
        !artist(payload.email, payload.sub, env)) throw Error();
    const ticket = await sign({ email: payload.email, sub: payload.sub }, env, "catalog-admin", "1h");
    return redirect("/gestao", [clear, setCookie(session, ticket, 3600)]);
  } catch {
    return redirect("/gestao?login=recusado", [clear]);
  }
}

export function loginPage(url, env) {
  if (!configured(url, env)) return error("Login do ateliê ainda não configurado.", 503);
  const notice = url.searchParams.get("login") === "recusado"
    ? "<p role=\"alert\">O acesso não foi autorizado. Confira se você escolheu a conta do ateliê.</p>" : "";
  return new Response(`<!doctype html><html lang="pt-BR"><meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Gerenciar peças | Galarza Ateliê</title>
    <link rel="stylesheet" href="/gestao-login.css">
    <main><p>Galarza Ateliê</p><h1>Gerenciar peças</h1>${notice}
    <a href="/gestao/google">Entrar com Google</a></main></html>`, {
    headers: { ...headers, "Content-Type": "text/html; charset=utf-8",
      "Content-Security-Policy": "default-src 'none'; style-src 'self'; base-uri 'none'; frame-ancestors 'none'" },
  });
}

export function authRoute(request, url, env) {
  if (!configured(url, env)) return error("Login do ateliê ainda não configurado.", 503);
  if (url.pathname === "/gestao/google" && request.method === "GET") return startLogin(url, env);
  if (url.pathname === callback && request.method === "GET") return finishLogin(request, url, env);
  if (url.pathname === "/gestao/sair" && request.method === "POST" && request.headers.get("Origin") === url.origin) {
    return redirect("/gestao", [setCookie(session, "", 0), setCookie(transaction, "", 0)]);
  }
  return error("Solicitação rejeitada.", 405);
}
