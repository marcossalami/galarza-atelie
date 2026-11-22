import { authRoute, authorized, loginPage } from "./password-auth.js";
import { homeRoute } from "./home.js";
import { isJpeg, readJson } from "./request-body.js";

const keyPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const fields = "id, name, format, measurements, price, published, reference, sold, revision, photo IS NOT NULL AS hasPhoto";
const publicFields = "id, legacy_slug, name, format, measurements, CASE WHEN published = 1 THEN price END AS price, reference, sold";
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
  const { name, format, measurements, price, photo = null, status, revision } = value;
  if (typeof name !== "string" || name.length > 100 ||
      typeof format !== "string" || format.length > 50 ||
      (measurements !== undefined && (typeof measurements !== "string" || measurements.length > 100)) ||
      (price !== null && (!Number.isInteger(price) || price < 1 || price > 99_999_999)) ||
      (status !== undefined && !["draft", "available", "reference", "sold"].includes(status)) ||
      (status === undefined && typeof value.publish !== "boolean") ||
      (photo !== null && !isJpeg(photo, 700_000))) return null;
  return { name: name.trim(), format: format.trim(), measurements: measurements?.trim(),
    price, photo, status, publish: value.publish, revision };
}

function imageResponse(photo) {
  return new Response(Uint8Array.from(atob(photo), (char) => char.charCodeAt(0)), {
    headers: { ...headers, "Content-Type": "image/jpeg" },
  });
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
  if (path === "/api/referencias") {
    if (request.method !== "GET") return json({ error: "Método indisponível." }, 405);
    if (!env.CATALOG_DB) return json({ error: "Referências temporariamente indisponíveis." }, 503);
    const { results } = await env.CATALOG_DB.prepare(
      `SELECT ${publicFields} FROM pieces WHERE reference = 1 ORDER BY rowid DESC`,
    ).all();
    return json(results);
  }
  const prefix = privatePath ? "/api/gestao/pecas" : "/api/pecas";
  if (!path.startsWith(prefix)) {
    return path.startsWith("/api/") || path.startsWith("/gestao")
      ? json({ error: "Página indisponível." }, 404) : env.ASSETS.fetch(request);
  }
  const suffix = path.slice(prefix.length);
  const match = /^\/([^/]+)(?:\/(foto)(?:\/([1-9]\d{0,2}))?)?$/.exec(suffix);
  const [, id = "", photoRequest, angle] = match ?? [];
  if (suffix && (!match || id.length > 100 || !keyPattern.test(id))) {
    return json({ error: "Peça não encontrada." }, 404);
  }
  const db = env.CATALOG_DB;
  if (!db) return json({ error: "Catálogo temporariamente indisponível." }, 503);
  if (request.method === "GET") {
    if (!id) {
      const list = privatePath
        ? `SELECT ${fields} FROM pieces ORDER BY rowid DESC`
        : `SELECT ${publicFields} FROM pieces WHERE published = 1 ORDER BY rowid DESC`;
      const { results } = await db.prepare(list).all();
      return json(results);
    }
    const visible = privatePath ? "" : " AND (published = 1 OR sold = 1 OR reference = 1)";
    const slug = id === "caneca-verde-desenhos" ? "caneca-verde-musica" : id;
    const selected = photoRequest ? (angle ? "id" : "photo") : privatePath ? fields : publicFields;
    const piece = await db.prepare(`SELECT ${selected} FROM pieces WHERE (id = ? OR legacy_slug = ?)${visible}`).bind(id, slug).first();
    if (!piece) return json({ error: "Peça não encontrada." }, 404);
    if (photoRequest) {
      const photo = angle ? (await db.prepare("SELECT photo FROM piece_angles WHERE piece_id = ? AND position = ?")
        .bind(piece.id, Number(angle)).first())?.photo : piece.photo;
      return photo ? imageResponse(photo) : json({ error: "Foto não encontrada." }, 404);
    }
    if (privatePath || !piece.legacy_slug) return json(piece);
    const { results: angles } = await db.prepare("SELECT position, alt FROM piece_angles WHERE piece_id = ? ORDER BY position").bind(piece.id).all();
    return json({ ...piece, angles });
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
  const previous = id && await db.prepare(`SELECT ${fields} FROM pieces WHERE id = ?`).bind(id).first();
  if (id && !previous) return json({ error: "Peça não encontrada." }, 404);
  const status = piece.status ?? (piece.publish || previous?.published ? "available"
    : previous?.reference ? "reference" : previous?.sold ? "sold" : "draft");
  const published = Number(status === "available");
  const reference = Number(status === "reference");
  const sold = Number(status === "sold");
  if (status !== "draft" && (!piece.name || !piece.format || !(piece.photo || previous?.hasPhoto))) {
    return json({ error: "Informe nome, tipo e foto para mostrar a peça na loja." }, 400);
  }
  if (published && !piece.price) {
    return json({ error: "Informe o preço para colocar a peça à venda." }, 400);
  }
  const savedId = id || crypto.randomUUID();
  const parameters = [piece.name, piece.format, piece.measurements ?? previous?.measurements ?? "",
    piece.price, piece.photo, published, reference, sold, savedId];
  const saved = id
    ? await db.prepare(`UPDATE pieces SET name=?, format=?, measurements=?, price=?, photo=coalesce(?,photo),
      published=?, reference=?, sold=?, revision=revision+1 WHERE id=? AND revision=? RETURNING ${fields}`)
      .bind(...parameters, Number.isSafeInteger(piece.revision) ? piece.revision : 0).first()
    : await db.prepare(`INSERT INTO pieces (name,format,measurements,price,photo,published,reference,sold,id)
      VALUES (?,?,?,?,?,?,?,?,?) RETURNING ${fields}`).bind(...parameters).first();
  return saved ? json(saved, id ? 200 : 201) : json({ error: "Esta peça mudou. Reabra o cadastro antes de salvar." }, 409);
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
