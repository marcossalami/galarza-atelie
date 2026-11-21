import { portfolioItems } from "../content/siteContent.js";
import { ExternalLink } from "./ExternalLink.jsx";

export function Portfolio() {
  return <section className="portfolio" id="portfolio" aria-labelledby="portfolio-title"><div className="portfolio-head"><div><p className="eyebrow">arquivo visual</p><h2 id="portfolio-title">Peças que<br /><i>viraram memória.</i></h2></div><p>Um recorte do ateliê: formas, esmaltes, correntes, estrelas e pequenos detalhes feitos à mão. Este é um portfólio; a disponibilidade de cada peça é confirmada pelo Instagram.</p></div><div className="portfolio-grid">{portfolioItems.map((item) => <figure className={`portfolio-card${item.size ? ` portfolio-card-${item.size}` : ""}`} key={item.image}><img src={`/portfolio/${item.image}`} alt={item.alt} loading="eager" /><figcaption>{item.caption}</figcaption></figure>)}</div><ExternalLink className="text-link portfolio-link">Ver mais trabalhos no Instagram</ExternalLink></section>;
}
