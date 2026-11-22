import { isJpeg, readJson } from "./request-body.js";
import { builtInSections, customSectionLimit, galleryPieceLimit, sectionTextLimit, sectionTitleLimit } from "../src/content/homeSections.js";

const pieceId = /^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/;

function validIds(ids, limit) {
  return Array.isArray(ids) && ids.length <= limit &&
    ids.every((id) => typeof id === "string" && pieceId.test(id)) && new Set(ids).size === ids.length;
}

function validSections(sections) {
  if (!Array.isArray(sections) || sections.length > customSectionLimit + Object.keys(builtInSections).length) return false;
  if (!sections.every((section) => section && typeof section.id === "string" && typeof section.visible === "boolean" &&
      (Object.hasOwn(builtInSections, section.id) ||
        (pieceId.test(section.id) && ["text", "gallery"].includes(section.kind) &&
          typeof section.title === "string" && section.title.length <= sectionTitleLimit &&
          typeof section.text === "string" && section.text.length <= sectionTextLimit &&
          (section.kind === "text" || validIds(section.pieceIds, galleryPieceLimit)))))) return false;
  const ids = new Set(sections.map(({ id }) => id));
  return ids.size === sections.length && Object.keys(builtInSections).every((id) => ids.has(id));
}

function cleanSection({ id, visible, kind, title, text, pieceIds }) {
  if (Object.hasOwn(builtInSections, id)) return { id, visible };
  const section = { id, visible, kind, title: title.trim(), text: text.trim() };
  return kind === "gallery" ? { ...section, pieceIds } : section;
}

function readyToPublish({ sections }) {
  return sections.every((section) => !section.visible || Object.hasOwn(builtInSections, section.id) ||
    (section.title && (section.kind === "gallery" ? section.pieceIds.length > 0 : section.text)));
}

function validHome(home) {
  return home && ["approved", "original", "upload"].includes(home.cover) &&
    (home.cover === "upload" ? isJpeg(home.photo, 450_000) : home.photo === null) &&
    validSections(home.sections) && validIds(home.highlights, 100);
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
  const input = await readJson(request, 490_000);
  if (!input || !Number.isSafeInteger(input.revision)) return json({ error: "Confira os dados da edição." }, 400);
  let change;
  if (input.action === "save" && validHome(input.draft)) {
    const { cover, photo, sections, highlights } = input.draft;
    const draft = JSON.stringify({
      cover, photo, sections: sections.map(cleanSection),
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
    const row = await select.first();
    if (row.revision === input.revision && !readyToPublish(JSON.parse(row.draft))) {
      return json({ error: "Preencha o título e o conteúdo das seções visíveis antes de publicar." }, 400);
    }
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
