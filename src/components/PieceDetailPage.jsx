import { instagramDirectUrl } from "../content/siteContent.js";
import { Footer } from "./Footer.jsx";
import { Header } from "./Header.jsx";
import { ExternalLink } from "./ExternalLink.jsx";

export function PieceDetailPage({ piece }) {
  return <main><div className="detail-page"><Header /><article className="detail-content"><a className="text-link" href="/?pagina=catalogo">← Voltar ao catálogo</a><div className="detail-grid"><img src={`/portfolio/${piece.image}`} alt={piece.alt} /><div><p className="eyebrow">{piece.availability}</p><h1>{piece.name}</h1><p>{piece.details}</p><dl><div><dt>Material</dt><dd>{piece.material}</dd></div><div><dt>Origem</dt><dd>{piece.origin}</dd></div><div><dt>Medidas e capacidade</dt><dd>Confirmar com o ateliê</dd></div><div><dt>Cuidados</dt><dd>Confirmar com o ateliê</dd></div></dl><ExternalLink className="button button-dark" href={instagramDirectUrl}>Consultar pelo Direct</ExternalLink></div></div></article></div><Footer /></main>;
}
