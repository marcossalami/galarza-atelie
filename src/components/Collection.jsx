import { productCategories } from "../content/siteContent.js";

export function Collection() {
  return <section className="collection" id="disponiveis"><div className="section-head"><div><p className="eyebrow">disponíveis</p><h2>Para a sua rotina.</h2></div><p className="section-note">Xícaras, bowls, travel mugs e acessórios para casa. As próximas peças serão apresentadas primeiro para quem estiver na lista.</p></div><div className="piece-grid">{productCategories.map((category, index) => <article className={`piece-card ${category.color}`} key={category.name}><span className="piece-number">{String(index + 1).padStart(2, "0")}</span><div className={`piece-shape ${category.shape}`} aria-hidden="true"></div><div className="piece-info"><h3>{category.name}</h3><p>{category.description}</p></div></article>)}</div></section>;
}
