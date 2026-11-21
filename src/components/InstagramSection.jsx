import { instagramHighlights, instagramUrl } from "../content/siteContent.js";

export function InstagramSection() {
  return <section className="instagram-section" aria-labelledby="instagram-title"><div className="instagram-heading"><div><p className="eyebrow">do instagram</p><h2 id="instagram-title">Coisas que estão<br /><i>acontecendo agora.</i></h2></div><div><p>Uma seleção feita pelo ateliê entre processos, detalhes e peças que passam pelo perfil.</p><a className="text-link" href={instagramUrl} target="_blank" rel="noopener noreferrer">@galarza.atelie ↗</a></div></div><div className="instagram-grid">{instagramHighlights.map((item) => <a className="instagram-card" href={instagramUrl} target="_blank" rel="noopener noreferrer" key={item.image} aria-label={`Abrir Instagram: ${item.label}`}><img src={`/portfolio/${item.image}`} alt={item.alt} loading="eager" /><span>{item.label}</span></a>)}</div></section>;
}
