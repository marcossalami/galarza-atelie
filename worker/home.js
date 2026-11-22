import { isJpeg, readJson } from "./request-body.js";

const pieceId = /^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/;

function validHome(home) {
  return home && ["approved", "original", "upload"].includes(home.cover) &&
    (home.cover === "upload" ? isJpeg(home.photo, 450_000) : home.photo === null) &&
    Array.isArray(home.sections) && home.sections.length === 2 &&
    home.sections.every((section) =>
      section && ["available", "references"].includes(section.id) && typeof section.visible === "boolean") &&
    home.sections[0].id !== home.sections[1].id &&
    Array.isArray(home.highlights) && home.highlights.length <= 100 &&
    home.highlights.every((id) => typeof id === "string" && pieceId.test(id)) &&
    new Set(home.highlights).size === home.highlights.length;
}

function adminState(row) {
  return { draft: JSON.parse(row.draft), revision: row.revision, canRestore: row.previous !== null };
}

async function coverVersion(photo) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(photo));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function homeRoute(request, url, db, json, headers) {
  if (!db) return json({ error: "Página inicial temporariamente indisponível." }, 503);
  const isAdmin = url.pathname === "/api/gestao/inicio";
  const select = db.prepare("SELECT draft, published, previous, revision FROM home WHERE id = 1");
  if (request.method === "GET") {
    if (isAdmin) return json(adminState(await select.first()));
    const row = await db.prepare("SELECT published, previous FROM home WHERE id = 1").first();
    const { photo, ...home } = JSON.parse(row.published);
    if (url.pathname === "/api/inicio") {
      return json({ ...home, photoUrl: photo ? `/api/inicio/foto?v=${await coverVersion(photo)}` : null });
    }
    const version = url.searchParams.get("v") ?? "";
    if (!/^[a-f0-9]{64}$/.test(version)) return json({ error: "Capa indisponível." }, 404);
    const previousPhoto = row.previous ? JSON.parse(row.previous).photo : null;
    const match = photo && await coverVersion(photo) === version ? photo
      : previousPhoto && await coverVersion(previousPhoto) === version ? previousPhoto : null;
    if (!match) return json({ error: "Capa indisponível." }, 404);
    return new Response(Uint8Array.from(atob(match), (char) => char.charCodeAt(0)), {
      headers: { ...headers, "Content-Type": "image/jpeg" },
    });
  }
  if (!isAdmin || request.method !== "POST") return json({ error: "Método indisponível." }, 405);
  if (request.headers.get("Origin") !== url.origin ||
      request.headers.get("Content-Type")?.split(";")[0] !== "application/json") {
    return json({ error: "Solicitação rejeitada." }, 403);
  }
  const input = await readJson(request, 465_000);
  if (!input || !Number.isSafeInteger(input.revision)) return json({ error: "Confira os dados da edição." }, 400);
  let change;
  if (input.action === "save" && validHome(input.draft)) {
    const { cover, photo, sections, highlights } = input.draft;
    const draft = JSON.stringify({
      cover, photo, sections: sections.map(({ id, visible }) => ({ id, visible })),
    });
    change = db.prepare(`UPDATE home SET draft = json_set(?, '$.highlights', json((
      SELECT json_group_array(id) FROM (
        SELECT pieces.id FROM json_each(?) AS selected
        JOIN pieces ON pieces.id = selected.value
        WHERE pieces.published = 1 ORDER BY selected.key
      )
    ))), revision = revision + 1 WHERE id = 1 AND revision = ?
    RETURNING draft, previous, revision`).bind(draft, JSON.stringify(highlights), input.revision);
  } else if (input.action === "publish") {
    change = db.prepare(`UPDATE home SET previous = published, published = draft, revision = revision + 1
      WHERE id = 1 AND revision = ? AND published <> draft
      RETURNING draft, previous, revision`).bind(input.revision);
  } else if (input.action === "restore") {
    change = db.prepare(`UPDATE home SET published = previous, previous = published, revision = revision + 1
      WHERE id = 1 AND revision = ? AND previous IS NOT NULL
      RETURNING draft, previous, revision`).bind(input.revision);
  } else {
    return json({ error: "Confira os dados e o tamanho da foto." }, 400);
  }
  const updated = await change.first();
  if (!updated) {
    const current = await select.first();
    if (input.action === "publish" && current.revision === input.revision) return json(adminState(current));
    return json({ error: "A página mudou. Recarregue o editor para abrir a versão atual." }, 409);
  }
  return json(adminState(updated));
}
