import { useEffect, useState } from "react";
import { getAvailablePieces, piecePrice, pieceUrl } from "../content/catalog.js";
import { commissionsUrl, instagramUrl, portfolioItems } from "../content/siteContent.js";
import "./storefront.css";

const referencesUrl = "/?pagina=referencias";
const referenceGroups = [
  { name: "Copos", images: ["copo-estrelas.jpeg"] },
  { name: "Xícaras e canecas", images: ["canecas-corrente-rosa.jpeg", "caneca-verde-desenhos.jpeg",
    "caneca-laco-azul.jpeg", "caneca-corrente-rosa.jpeg", "canecas-florais.jpeg", "caneca-teia.jpeg"] },
  { name: "Vasos", images: ["vaso-azul.jpeg"] },
  { name: "Porta-retratos", images: ["porta-retrato.jpeg"] },
];

async function readHome(path, signal) {
  const response = await fetch(path, { signal });
  if (response.status === 404 || (response.ok && !response.headers.get("Content-Type")?.includes("application/json"))) return null;
  if (!response.ok) throw new Error("Página inicial indisponível.");
  return response.json();
}

export function StorefrontHeader({ showAvailable } = {}) {
  const [linksToAvailable, setLinksToAvailable] = useState(false);
  useEffect(() => {
    if (showAvailable !== undefined) return;
    const request = new AbortController();
    readHome("/api/inicio", request.signal)
      .then((home) => setLinksToAvailable(!home || home.sections.some(({ id, visible }) => id === "available" && visible)))
      .catch(() => {});
    return () => request.abort();
  }, [showAvailable]);
  return <header className="storefront-header storefront-wrap">
    <a className="storefront-brand" href="/">Galarza Ateliê</a>
    <details onKeyDown={(event) => {
      if (event.key === "Escape" && event.currentTarget.open) {
        event.currentTarget.open = false;
        event.currentTarget.querySelector("summary").focus();
      }
    }}>
      <summary aria-label="Menu"><span aria-hidden="true">⋯</span></summary>
      <nav aria-label="Navegação principal">
        <a href="/">Início</a>
        {(showAvailable ?? linksToAvailable) && <a href="/#disponiveis" onClick={(event) => {
          const section = document.getElementById("disponiveis");
          if (section && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) {
            section.focus({ preventScroll: true });
            event.currentTarget.closest("details").open = false;
          }
        }}>Peças disponíveis</a>}
        <a href={referencesUrl}>Referências</a>
        <a href={commissionsUrl}>Encomendas</a>
      </nav>
    </details>
  </header>;
}

function PortfolioPhoto({ item, ...props }) {
  return <img src={item.photoUrl ?? `/portfolio/${item.image}`} alt={item.alt} {...props} />;
}

const defaultSections = [{ id: "available", visible: true }, { id: "references", visible: true }];

export function Storefront({ preview = false }) {
  const [published, setPublished] = useState([]);
  const [home, setHome] = useState(undefined);
  const [homeError, setHomeError] = useState(false);
  useEffect(() => {
    const request = new AbortController();
    fetch("/api/pecas", { signal: request.signal })
      .then((response) => response.ok ? response.json() : [])
      .then((items) => {
        if (Array.isArray(items)) setPublished(items.map((piece) => ({
          slug: piece.id, name: piece.name, alt: piece.name, priceInCents: piece.price,
          photoUrl: `/api/pecas/${piece.id}/foto`,
        })));
      }).catch(() => {});
    readHome(preview ? "/api/gestao/inicio" : "/api/inicio", request.signal)
      .then((data) => {
        if (preview && !data?.draft) throw new Error("Prévia indisponível.");
        setHome(preview ? data.draft : data);
      }).catch(() => { if (!request.signal.aborted) setHomeError(true); });
    return () => request.abort();
  }, [preview]);
  const pieces = [...published, ...getAvailablePieces()];
  if (preview && !home) return <p role="status">{homeError ? "Prévia indisponível. Entre novamente na gestão." : "Carregando prévia…"}</p>;

  const sections = home === null ? defaultSections : (home?.sections ?? []);
  const showAvailable = sections.some(({ id, visible }) => id === "available" && visible);
  const highlights = (home?.highlights ?? []).map((id) => pieces.find((piece) => piece.slug === id)).filter(Boolean);
  const rest = pieces.filter((piece) => !highlights.includes(piece));
  const coverPhoto = home?.cover === "approved" ? "/galarza-capa-acervo.jpg"
    : home?.photo ? `data:image/jpeg;base64,${home.photo}` : home?.photoUrl;
  const cover = home !== undefined && <PortfolioPhoto className="storefront-cover"
    item={coverPhoto ? { photoUrl: coverPhoto, alt: "Cerâmicas artesanais do Galarza Ateliê" } : portfolioItems[0]}
    fetchPriority="high" />;
  const coverLink = !showAvailable ? null : home ? "#disponiveis" : pieceUrl(portfolioItems[0]);
  const pieceCards = (items) => <div className="storefront-grid">
    {items.map((piece) => <a className="storefront-card" key={piece.slug} href={piece.photoUrl ? `/?publicada=${piece.slug}` : pieceUrl(piece)}>
      <PortfolioPhoto item={piece} loading="lazy" />
      <span>{piece.name}</span>
      <small>{piecePrice(piece)}</small>
    </a>)}
  </div>;
  const available = <section key="available" className="storefront-wrap storefront-section" id="disponiveis" tabIndex={-1} aria-labelledby="available-title">
    <h2 id="available-title">Peças disponíveis</h2>
    {highlights.length > 0 && <div className="storefront-highlights">
      <h3>Em destaque</h3>
      {pieceCards(highlights)}
    </div>}
    {rest.length > 0 && pieceCards(rest)}
    {!pieces.length && <>
      <p>Sem peças disponíveis no momento.</p>
      <div className="storefront-actions">
        <a className="storefront-button" href={commissionsUrl}>Encomendar</a>
        <a className="text-link" href={referencesUrl}>Ver referências</a>
      </div>
    </>}
  </section>;
  const references = <section key="references" className="storefront-reference-band" id="portfolio">
    <div className="storefront-wrap storefront-section">
      <h2>Referências</h2>
      <div className="storefront-grid">
        {[portfolioItems[1], portfolioItems[5], portfolioItems[7]].map((item) =>
          <a className="storefront-card" href={pieceUrl(item)} key={item.image}>
            <PortfolioPhoto item={item} loading="lazy" />
            <span>{item.caption}</span>
          </a>)}
      </div>
      <a className="text-link" href={referencesUrl}>Explorar galeria</a>
    </div>
  </section>;
  return <div className="storefront" onClick={preview ? (event) => {
    const link = event.target.closest("a");
    if (link && !link.getAttribute("href")?.startsWith("#")) event.preventDefault();
  } : undefined}>
    <StorefrontHeader showAvailable={showAvailable} />
    <main>
      <section className="storefront-hero storefront-wrap" aria-labelledby="storefront-title">
        <div className="storefront-hero-copy">
          <h1 id="storefront-title">Galarza <br />Ateliê</h1>
          <p>Cerâmicas feitas à mão.</p>
          <div className="storefront-actions" id="encomendas">
            <a className="storefront-button" href={commissionsUrl}>Encomendar</a>
            <a className="storefront-instagram" href={instagramUrl}>
              <span className="storefront-instagram-icon" aria-hidden="true" />Instagram
            </a>
          </div>
        </div>
        {coverLink ? <a className="storefront-cover-link" href={coverLink}
          aria-label={home ? "Ver peças disponíveis" : "Ver detalhes das canecas da capa"}>{cover}</a>
          : <div className="storefront-cover-link">{cover}</div>}
      </section>
      {homeError && <p role="status" className="storefront-wrap">Não foi possível carregar a página inicial. Recarregue para tentar novamente.</p>}
      {sections.filter(({ visible }) => visible).map(({ id }) => id === "available" ? available : references)}
    </main>
  </div>;
}

export function ReferencesPage() {
  return <div className="storefront">
    <StorefrontHeader />
    <main className="storefront-wrap storefront-section storefront-gallery">
      <h1>Referências</h1>
      <a className="storefront-button" href={commissionsUrl}>Encomendar</a>
      {referenceGroups.map(({ name, images }) => <section className="storefront-group" key={name}>
        <h2>{name}</h2>
        <div className="storefront-grid">
          {images.map((image) => {
            const item = portfolioItems.find((entry) => entry.image === image);
            return <a className="storefront-card" href={pieceUrl(item)} key={image}>
              <PortfolioPhoto item={item} loading="lazy" />
              <span>{item.caption}</span>
            </a>;
          })}
        </div>
      </section>)}
    </main>
  </div>;
}
