import { useState } from "react";
import { piecePrice } from "../content/catalog.js";
import { instagramDirectUrl } from "../content/siteContent.js";
import { StorefrontHeader } from "./Storefront.jsx";

export function PieceDetailPage({ piece }) {
  const [copied, setCopied] = useState(null);
  const price = piecePrice(piece);
  const sold = piece.status === "sold";
  const message = `Oi! Gostaria de saber mais sobre a peça ${piece.name}.`;
  const photos = [{ image: piece.image, alt: piece.alt }, ...(piece.photos ?? [])];

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return <div className="storefront">
    <StorefrontHeader />
    <main className="storefront-wrap storefront-section">
      <a className="text-link" href="/?pagina=referencias">← Ver referências</a>
      <article className="storefront-detail">
        <div className="storefront-detail-photos">
          {photos.map(({ image, alt }) => <img key={image} src={`/portfolio/${image}`} alt={alt} />)}
        </div>
        <div>
          <h1>{piece.name}</h1>
          <p>{sold ? "Vendida" : piece.status === "available" && price ? price : piece.availability}</p>
          {piece.details && <p>{piece.details}</p>}
          <dl>
            {piece.material && <><dt>Material</dt><dd>{piece.material}</dd></>}
            {piece.origin && <><dt>Origem</dt><dd>{piece.origin}</dd></>}
            {piece.measurements && <><dt>Medidas</dt><dd>{piece.measurements}</dd></>}
            {piece.capacity && <><dt>Capacidade</dt><dd>{piece.capacity}</dd></>}
          </dl>
          {!sold && <>
            <div className="storefront-actions">
              <a className="storefront-button" href={instagramDirectUrl}>Consultar pelo Direct</a>
              <button className="storefront-instagram" type="button" onClick={copyMessage}>Copiar mensagem</button>
            </div>
            {copied !== null && <p className="storefront-detail-message" role="status">
              {copied ? "Mensagem copiada." : <>Copie esta mensagem: {message}</>}
            </p>}
          </>}
        </div>
      </article>
    </main>
  </div>;
}
