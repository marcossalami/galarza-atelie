import { ExternalLink } from "./ExternalLink.jsx";
import { instagramDirectUrl } from "../content/siteContent.js";

export function Commissions() {
  return <section className="commissions" id="encomendas"><p className="eyebrow">encomendas</p><h2>Tem uma peça<br />em <i>mente?</i></h2><p>Para começar, envie pelo Direct um resumo da sua ideia, medidas, cores, acabamento, prazo e referências. Assim consigo entender o que você imagina antes de confirmar uma encomenda.</p><ExternalLink className="button button-dark" href={instagramDirectUrl}>Iniciar encomenda pelo Direct</ExternalLink></section>;
}
