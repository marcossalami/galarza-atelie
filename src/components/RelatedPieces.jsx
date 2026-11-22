import { useEffect, useState } from "react";
import { piecePrice, pieceSlug } from "../content/catalog.js";

function normalizedType(type) {
  return (type ?? "").normalize("NFD").replace(/\p{Diacritic}/gu, "").trim().toLocaleLowerCase("pt-BR");
}

export function RelatedPieces({ piece }) {
  const [items, setItems] = useState([]);
  const id = piece.id ?? pieceSlug(piece);
  const type = normalizedType(piece.format);
  useEffect(() => {
    const request = new AbortController();
    async function load(path) {
      const response = await fetch(path, { signal: request.signal });
      const data = response.ok ? await response.json() : [];
      return Array.isArray(data) ? data : [];
    }
    Promise.allSettled([load("/api/pecas"), load("/api/referencias")]).then((results) => {
      if (request.signal.aborted) return;
      const catalog = new Map(results.flatMap((result) => result.status === "fulfilled" ? result.value : [])
        .filter((item) => item.id !== id && item.legacy_slug !== id).map((item) => [item.id, item]));
      setItems([...catalog.values()].sort((a, b) =>
        Number(Boolean(type && normalizedType(b.format) === type)) - Number(Boolean(type && normalizedType(a.format) === type)),
      ).slice(0, 3));
    });
    return () => request.abort();
  }, [id, type]);
  if (!items.length) return null;
  return <section className="storefront-related" aria-labelledby="related-title">
    <h2 id="related-title">Ver mais peças</h2>
    <div className="storefront-grid">
      {items.map((item) => <a className="storefront-card" key={item.id} href={`/?publicada=${item.id}`}>
        <img loading="lazy" src={`/api/pecas/${item.id}/foto`} alt="" />
        <span>{item.name}</span>
        <small>{item.reference ? "Referência" : piecePrice({ priceInCents: item.price })}</small>
      </a>)}
    </div>
  </section>;
}
