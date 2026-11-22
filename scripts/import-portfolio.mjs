import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const pieces = [
  { slug: "canecas-corrente-rosa", name: "Canecas com corrente rosa", type: "Caneca" },
  { slug: "canecas-corrente", name: "Canecas com corrente escura", type: "Caneca" },
  { slug: "caneca-corrente-rosa", name: "Caneca corrente rosa", type: "Caneca" },
  { slug: "caneca-coracoes", name: "Caneca corações", type: "Caneca" },
  { slug: "caneca-verde-musica", name: "Caneca verde", type: "Caneca",
    angles: [["caneca-verde-desenhos", "Lateral da caneca verde com desenhos"]] },
  { slug: "caneca-laco-azul", name: "Caneca laço azul", type: "Caneca" },
  { slug: "canecas-florais", name: "Flores à mesa", type: "Caneca" },
  { slug: "caneca-teia", name: "Caneca teia", type: "Caneca", angles: [
    ["caneca-teia-topo", "Vista de cima da caneca teia"],
    ["caneca-teia-interior", "Interior da caneca teia"],
  ] },
  { slug: "copo-estrelas", name: "Copo estrelas", type: "Copo", angles: [
    ["copo-estrelas-lateral", "Vista lateral do copo com estrelas"],
    ["copo-estrelas-interior", "Interior do copo de cerâmica"],
    ["copo-estrelas-frente", "Vista frontal do copo com estrelas"],
  ] },
  { slug: "vaso-azul", name: "Vaso azul", type: "Vaso" },
  { slug: "porta-retrato-estrelas", image: "porta-retrato", name: "Porta-retrato estrelas", type: "Porta-retrato" },
];

const database = process.argv[2];
const { CLOUDFLARE_ACCOUNT_ID: account, CLOUDFLARE_API_TOKEN: token } = process.env;
if (!database || !account || !token) throw new Error("Informe o ID do D1 e configure as credenciais do Cloudflare no ambiente.");

async function query(sql, params) {
  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/d1/database/${database}/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ sql, params }),
  });
  const result = await response.json();
  if (!response.ok || !result.success || !result.result?.[0]?.success) {
    throw new Error(`Falha ao importar catálogo (HTTP ${response.status}): ${result.errors?.[0]?.message ?? "consulta rejeitada"}`);
  }
  return result.result[0];
}

function photo(key) {
  return readFile(new URL(`../public/portfolio/${key}.jpeg`, import.meta.url), "base64");
}

let created = 0;
for (const piece of pieces) {
  const hash = createHash("sha256").update(`galarza:portfolio:${piece.slug}`).digest("hex");
  const id = `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
  const result = await query(
    "INSERT INTO pieces (id, legacy_slug, name, format, photo, reference) VALUES (?,?,?,?,?,1) ON CONFLICT DO NOTHING",
    [id, piece.slug, piece.name, piece.type, await photo(piece.image ?? piece.slug)],
  );
  created += result.meta.changes;
  const stored = await query("SELECT id FROM pieces WHERE legacy_slug = ?", [piece.slug]);
  for (const [index, [file, alt]] of (piece.angles ?? []).entries()) {
    await query("INSERT INTO piece_angles (piece_id, position, photo, alt) VALUES (?,?,?,?) ON CONFLICT DO NOTHING",
      [stored.results[0].id, index + 1, await photo(file), alt]);
  }
}
console.log(`${created} peças importadas. ${pieces.length} cadastros do portfólio conferidos.`);
