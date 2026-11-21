import { instagramUrl } from "../content/siteContent.js";

export function Footer() {
  return <footer><a className="brand footer-brand" href="#inicio" aria-label="Galarza Ateliê, início"><img src="/galarza-logo.jpeg" alt="Galarza Ateliê" /></a><p>Campo Grande, MS · Brasil</p><div><a href="#portfolio">Portfólio</a><a href={instagramUrl} target="_blank" rel="noopener noreferrer">Instagram</a><a href="#encomendas">Encomendas</a></div></footer>;
}
