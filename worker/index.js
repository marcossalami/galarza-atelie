import { authRoute, authorized, loginPage } from "./password-auth.js";
import { homeRoute } from "./home.js";
import { isJpeg, readJson } from "./request-body.js";

const idPattern = /^\/[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/;
const fields = "id, name, format, price, published, sold, revision, photo IS NOT NULL AS hasPhoto";
const headers = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "same-origin",
};

function json(value, status = 200) {
  return Response.json(value, { status, headers });
}

async function readPiece(request) {
  const value = await readJson(request, 710_000);
  if (!value) return null;
  const { name, format, price, photo = null, publish, revision } = value;
    if (typeof name !== "string" || name.length > 100 ||
        typeof format !== "string" || format.length > 50 ||
        (price !== null && (!Number.isInteger(price) || price < 1 || price > 99_999_999)) ||
        typeof publish !== "boolean" ||
        (photo !== null && !isJpeg(photo, 700_000))) return null;
  return { name: name.trim(), format: format.trim(), price, photo, publish, revision };
}

async function handle(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const adminPage = path === "/gestao" || path === "/gestao/";
  const privatePath = /^\/api\/gestao(?:\/|$)/.test(path);
  if (path === "/gestao/entrar" || path === "/gestao/sair") {
    return authRoute(request, url, env);
  }
  if ((adminPage || privatePath) && !await authorized(request, url, env)) {
    if (adminPage && request.method === "GET") return loginPage(url, env);
    return json({ error: "Acesso restrito à artista." }, 403);
  }
  if (adminPage && request.method === "GET") {
    const asset = await env.ASSETS.fetch(new Request(new URL("/", url)));
    const response = new Response(asset.body, { status: asset.status, headers: asset.headers });
    for (const [name, value] of Object.entries(headers)) response.headers.set(name, value);
    if (url.searchParams.get("ver") === "inicio") {
      response.headers.set("X-Frame-Options", "SAMEORIGIN");
      const policy = response.headers.get("Content-Security-Policy");
      if (policy) response.headers.set("Content-Security-Policy", policy.replace("frame-ancestors 'none'", "frame-ancestors 'self'"));
    }
    return response;
  }
  if (["/api/inicio", "/api/inicio/foto", "/api/gestao/inicio"].includes(path)) {
    return homeRoute(request, url, env.CATALOG_DB, json, headers);
  }
  const prefix = privatePath ? "/api/gestao/pecas" : "/api/pecas";
  if (!path.startsWith(prefix)) {
    return path.startsWith("/api/") || path.startsWith("/gestao")
      ? json({ error: "Página indisponível." }, 404) : env.ASSETS.fetch(request);
  }
  const suffix = path.slice(prefix.length);
  const photoRequest = suffix.endsWith("/foto");
  const idPath = photoRequest ? suffix.slice(0, -5) : suffix;
  if ((idPath && !idPattern.test(idPath)) || (photoRequest && !idPath)) {
    return json({ error: "Peça não encontrada." }, 404);
  }
  const id = idPath.slice(1);
  const db = env.CATALOG_DB;
  if (!db) return json({ error: "Catálogo temporariamente indisponível." }, 503);
  if (request.method === "GET") {
    if (!id) {
      const list = privatePath
        ? `SELECT ${fields} FROM pieces ORDER BY rowid DESC`
        : "SELECT id, name, format, price FROM pieces WHERE published = 1 ORDER BY rowid DESC";
      const { results } = await db.prepare(list).all();
      return json(results);
    }
    const visible = privatePath ? "" : " AND (published = 1 OR sold = 1)";
    const selected = photoRequest ? "photo" : privatePath ? fields
      : "id, name, format, CASE WHEN sold = 0 THEN price END AS price, sold";
    const piece = await db.prepare(`SELECT ${selected} FROM pieces WHERE id = ?${visible}`).bind(id).first();
    if (!piece || (photoRequest && !piece.photo)) return json({ error: "Peça não encontrada." }, 404);
    if (!photoRequest) return json(piece);
    return new Response(Uint8Array.from(atob(piece.photo), (char) => char.charCodeAt(0)), {
      headers: { ...headers, "Content-Type": "image/jpeg" },
    });
  }
  const changeAvailability = request.method === "PATCH" && Boolean(id);
  if (!privatePath || photoRequest || (!changeAvailability && request.method !== (id ? "PUT" : "POST"))) {
    return json({ error: "Método indisponível." }, 405);
  }
  if (request.headers.get("Origin") !== url.origin ||
      request.headers.get("Content-Type")?.split(";")[0] !== "application/json") {
    return json({ error: "Solicitação rejeitada." }, 403);
  }
  if (changeAvailability) {
    const change = await readJson(request, 256);
    if (!["withdraw", "sold"].includes(change?.action) || !Number.isSafeInteger(change.revision)) {
      return json({ error: "Confira a situação da peça." }, 400);
    }
    const updated = await db.prepare(`UPDATE pieces SET published = 0, sold = ?, revision = revision + 1
      WHERE id = ? AND revision = ? AND published = 1 RETURNING ${fields}`)
      .bind(Number(change.action === "sold"), id, change.revision).first();
    return updated ? json(updated) : json({ error: "A peça mudou. Reabra o cadastro." }, 409);
  }
  const piece = await readPiece(request);
  if (!piece) return json({ error: "Confira os campos e o tamanho da foto." }, 400);
  const previous = id && await db.prepare("SELECT published, sold, revision, photo IS NOT NULL AS hasPhoto FROM pieces WHERE id = ?").bind(id).first();
  if (id && !previous) return json({ error: "Peça não encontrada." }, 404);
  const published = Number(Boolean(previous?.published || piece.publish));
  const sold = published ? 0 : (previous?.sold ?? 0);
  if ((published || sold) && (!piece.name || !piece.format || !piece.price || !(piece.photo || previous?.hasPhoto))) {
    return json({ error: "Informe nome, formato, preço e foto para manter a página pública da peça." }, 400);
  }
  const savedId = id || crypto.randomUUID();
  const parameters = [piece.name, piece.format, piece.price, piece.photo, published, savedId];
  if (id) {
    const result = await db.prepare(
      "UPDATE pieces SET name=?, format=?, price=?, photo=coalesce(?,photo), published=?, sold=?, revision=revision+1 WHERE id=? AND revision=?",
    ).bind(...parameters.slice(0, -1), sold, savedId, Number.isSafeInteger(piece.revision) ? piece.revision : 0).run();
    if (!result.meta.changes) return json({ error: "Esta peça mudou. Reabra o cadastro antes de salvar." }, 409);
  } else {
    await db.prepare("INSERT INTO pieces (name,format,price,photo,published,id) VALUES (?,?,?,?,?,?)").bind(...parameters).run();
  }
  return json({ id: savedId, name: piece.name, format: piece.format, price: piece.price,
    published, sold, hasPhoto: Boolean(piece.photo || previous?.hasPhoto), revision: id ? piece.revision + 1 : 1 }, id ? 200 : 201);
}

export default {
  async fetch(request, env) {
    try {
      return await handle(request, env);
    } catch {
      return json({ error: "Serviço temporariamente indisponível." }, 503);
    }
  },
};
