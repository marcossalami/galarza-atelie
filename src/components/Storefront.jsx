import { getAvailablePieces, piecePrice } from "../content/catalog.js";
import { instagramDirectUrl, instagramUrl, portfolioItems } from "../content/siteContent.js";
import "./storefront.css";

const referencesUrl = "/?pagina=referencias";
const referenceGroups = [
  { name: "Copos", images: ["copo-estrelas.jpeg"] },
  { name: "Xícaras e canecas", images: ["canecas-corrente-rosa.jpeg", "caneca-verde-desenhos.jpeg",
    "caneca-laco-azul.jpeg", "caneca-corrente-rosa.jpeg", "canecas-florais.jpeg", "caneca-teia.jpeg"] },
  { name: "Vasos", images: ["vaso-azul.jpeg"] },
  { name: "Porta-retratos", images: ["porta-retrato.jpeg"] },
];

export function StorefrontHeader() {
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
        <a href="/#disponiveis" onClick={(event) => {
          const section = document.getElementById("disponiveis");
          if (section) {
            section.focus({ preventScroll: true });
            event.currentTarget.closest("details").open = false;
          }
        }}>Peças disponíveis</a>
        <a href={referencesUrl}>Referências</a>
      </nav>
    </details>
  </header>;
}

function PortfolioPhoto({ item, ...props }) {
  return <img src={`/portfolio/${item.image}`} alt={item.alt} {...props} />;
}

export function Storefront() {
  const pieces = getAvailablePieces();
  return <div className="storefront">
    <StorefrontHeader />
    <main>
      <section className="storefront-hero storefront-wrap" aria-labelledby="storefront-title">
        <div className="storefront-hero-copy">
          <h1 id="storefront-title">Galarza <br />Ateliê</h1>
          <p>Cerâmicas feitas à mão.</p>
          <div className="storefront-actions">
            <a className="storefront-button" href={instagramDirectUrl}>Encomendar</a>
            <a className="storefront-instagram" href={instagramUrl}>
              <span className="storefront-instagram-icon" aria-hidden="true" />Instagram
            </a>
          </div>
        </div>
        <PortfolioPhoto className="storefront-cover" item={portfolioItems[0]} fetchPriority="high" />
      </section>
      <section className="storefront-wrap storefront-section" id="disponiveis" tabIndex={-1} aria-labelledby="available-title">
        <h2 id="available-title">Peças disponíveis</h2>
        {pieces.length ? <div className="storefront-grid">
          {pieces.map((piece) => <a className="storefront-card" key={piece.slug} href={`/?peca=${encodeURIComponent(piece.slug)}`}>
            <PortfolioPhoto item={piece} loading="lazy" />
            <span>{piece.name}</span>
            <small>{piecePrice(piece)}</small>
          </a>)}
        </div> : <>
          <p>Sem peças disponíveis no momento.</p>
          <div className="storefront-actions">
            <a className="storefront-button" href={instagramDirectUrl}>Encomendar</a>
            <a className="text-link" href={referencesUrl}>Ver referências</a>
          </div>
        </>}
      </section>
      <section className="storefront-reference-band">
        <div className="storefront-wrap storefront-section">
          <h2>Referências</h2>
          <div className="storefront-grid">
            {[portfolioItems[1], portfolioItems[5], portfolioItems[7]].map((item) =>
              <a className="storefront-card" href={referencesUrl} key={item.image}>
                <PortfolioPhoto item={item} loading="lazy" />
                <span>{item.caption}</span>
              </a>)}
          </div>
          <a className="text-link" href={referencesUrl}>Explorar galeria</a>
        </div>
      </section>
    </main>
  </div>;
}

export function ReferencesPage() {
  return <div className="storefront">
    <StorefrontHeader />
    <main className="storefront-wrap storefront-section storefront-gallery">
      <h1>Referências</h1>
      <a className="storefront-button" href={instagramDirectUrl}>Encomendar</a>
      {referenceGroups.map(({ name, images }) => <section className="storefront-group" key={name}>
        <h2>{name}</h2>
        <div className="storefront-grid">
          {images.map((image) => {
            const item = portfolioItems.find((entry) => entry.image === image);
            return <figure className="storefront-card" key={image}>
              <PortfolioPhoto item={item} loading="lazy" />
              <figcaption>{item.caption}</figcaption>
            </figure>;
          })}
        </div>
      </section>)}
    </main>
  </div>;
}
