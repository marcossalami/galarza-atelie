import { useEffect, useState } from "react";
import { pieceUrl } from "../content/catalog.js";
import { instagramUrl } from "../content/siteContent.js";
import { StorefrontHeader } from "./Storefront.jsx";

export function CommissionPage({ piece: staticPiece, publishedId }) {
  const [published, setPublished] = useState(null);
  const [copied, setCopied] = useState(null);
  useEffect(() => {
    if (!publishedId) return;
    const request = new AbortController();
    fetch(`/api/pecas/${encodeURIComponent(publishedId)}`, { signal: request.signal })
      .then((response) => response.ok ? response.json() : null)
      .then((piece) => { if (piece) setPublished(piece); }).catch(() => {});
    return () => request.abort();
  }, [publishedId]);
  const piece = published ?? staticPiece;
  const detailPath = published ? `/?publicada=${published.id}` : piece && pieceUrl(piece);
  const referenceUrl = detailPath && new URL(detailPath, window.location.origin).href;

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
      {piece && <a className="storefront-order-piece" href={detailPath}>
        <img src={published ? `/api/pecas/${published.id}/foto` : `/portfolio/${piece.image}`} alt={piece.alt ?? piece.name} />
        <span><small>Peça de referência</small><strong>{piece.name}</strong></span>
      </a>}
      <p>Abra o perfil <strong>@galarza.atelie</strong> e toque em <strong>Mensagem</strong>.
        {piece ? " Envie o link da peça para mostrar sua referência." : " Conte sua ideia ou envie uma foto de referência."}
      </p>
      <div className="storefront-actions">
        <a className="storefront-button" href={instagramUrl}>Mandar mensagem</a>
        {piece && <button className="storefront-instagram" type="button" onClick={copyLink}>Copiar link da peça</button>}
      </div>
      <p>Se o navegador pedir login, você também pode abrir o app do Instagram e buscar <strong>@galarza.atelie</strong>.</p>
      <p className="storefront-detail-message" role="status">
        {copied === true && "Link copiado. Cole na conversa do Instagram."}
        {copied === false && <a className="text-link" href={referenceUrl}>{referenceUrl}</a>}
      </p>
    </main>
  </div>;
}
