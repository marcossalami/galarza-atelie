import { commissionsUrl, instagramUrl } from "../content/siteContent.js";

export function Footer() {
  return <footer><a className="brand footer-brand" href="/" aria-label="Galarza Ateliê, início"><img src="/galarza-estrela.jpeg" alt="" /><span>Galarza<br />Ateliê</span></a><p>Campo Grande, MS · Brasil</p><div><a href="/?pagina=referencias">Portfólio</a><a href={instagramUrl} target="_blank" rel="noopener noreferrer">Instagram</a><a href={commissionsUrl}>Encomendas</a></div></footer>;
}
