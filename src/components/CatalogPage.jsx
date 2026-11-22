import { useEffect, useState } from "react";
import { catalogCategories, catalogItems, pieceAvailability } from "../content/catalog.js";
import { Footer } from "./Footer.jsx";
import { Header } from "./Header.jsx";

function catalogEntry(piece) {
  const type = piece.format.toLocaleLowerCase("pt-BR");
  const category = /caneca|xícara/.test(type) ? "xicaras" : /bowl/.test(type) ? "bowls"
    : /copo|travel mug/.test(type) ? "travel-mugs" : "casa";
  return { ...piece, slug: piece.id, category, alt: piece.name, priceInCents: piece.price,
    status: piece.reference ? "reference" : "available", availability: "Referência para encomendas" };
}

export function CatalogPage() {
  const [category, setCategory] = useState(catalogCategories[0].id);
  const [catalog, setCatalog] = useState(null);
  useEffect(() => {
    const request = new AbortController();
    const read = async (path) => {
      const response = await fetch(path, { signal: request.signal });
      if (!response.ok) throw new Error("Catálogo indisponível");
      return response.json();
    };
    Promise.all([read("/api/pecas"), read("/api/referencias")]).then(([available, references]) => {
      setCatalog([...available, ...references].map(catalogEntry));
    }).catch(() => {});
    return () => request.abort();
  }, []);
  const items = (catalog ?? catalogItems).filter((item) => item.category === category);
  return <main>
    <div className="catalog-page">
      <Header />
      <section className="catalog-content" aria-labelledby="catalog-title">
        <p className="eyebrow">catálogo</p>
        <h1 id="catalog-title">Peças feitas<br />sem <i>repetição.</i></h1>
        <p className="catalog-intro">Cada foto registra uma peça do ateliê. A disponibilidade é confirmada diretamente com a artista, antes de qualquer reserva.</p>
        <div className="catalog-tabs" role="tablist" aria-label="Categorias de peças">
          {catalogCategories.map((item) => <button className={category === item.id ? "is-active" : ""}
            role="tab" aria-selected={category === item.id} key={item.id} onClick={() => setCategory(item.id)}>{item.label}</button>)}
        </div>
        {items.length ? <div className="catalog-grid">
          {items.map((item) => <article className="catalog-card" key={item.slug}>
            <img src={item.id ? `/api/pecas/${item.id}/foto` : `/portfolio/${item.image}`} alt={item.alt} />
            <div>
              <p className="availability">{pieceAvailability(item)}</p>
              <h2>{item.name}</h2>
              <a className="text-link" href={item.id ? `/?publicada=${item.id}` : `/?peca=${item.slug}`}>Ver detalhes</a>
            </div>
          </article>)}
        </div> : <p className="catalog-empty">Ainda não há peças fotografadas neste formato.</p>}
      </section>
    </div>
    <Footer />
  </main>;
}
