import { useState } from "react";
import { pieceUrl } from "../content/catalog.js";
import { instagramUrl, instagramDirectUrl } from "../content/siteContent.js";
import { StorefrontHeader } from "./Storefront.jsx";

export function CommissionPage({ piece }) {
  const [copied, setCopied] = useState(null);
  const referenceUrl = piece && new URL(pieceUrl(piece), window.location.origin).href;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(referenceUrl);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return <div className="storefront">
    <StorefrontHeader />
    <main className="storefront-wrap storefront-section storefront-contact">
      <h1>Encomendas</h1>
      {piece && <a className="storefront-order-piece" href={pieceUrl(piece)}>
        <img src={`/portfolio/${piece.image}`} alt={piece.alt} />
        <span><small>Peça de referência</small><strong>{piece.name}</strong></span>
      </a>}
      <p>Abra o perfil <strong>@galarza.atelie</strong> e toque em <strong>Mensagem</strong>.
        {piece ? " Envie o link da peça para mostrar sua referência." : " Conte sua ideia ou envie uma foto de referência."}
      </p>
      <div className="storefront-actions">
        <a className="storefront-button" href={instagramUrl}>Abrir perfil no Instagram</a>
        <a className="text-link" href={instagramDirectUrl}>Tentar abrir o Direct</a>
        {piece && <button className="storefront-instagram" type="button" onClick={copyLink}>Copiar link da peça</button>}
      </div>
      <p className="storefront-detail-message" role="status">
        {copied === true && "Link copiado. Cole na conversa do Instagram."}
        {copied === false && <a className="text-link" href={referenceUrl}>{referenceUrl}</a>}
      </p>
    </main>
  </div>;
}
