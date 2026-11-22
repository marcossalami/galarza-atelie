import { useRef, useState } from "react";
import { pieceAvailability, piecePrice, pieceSlug } from "../content/catalog.js";
import { commissionsUrl } from "../content/siteContent.js";
import { PhotoViewer } from "./PhotoViewer.jsx";
import { PiecePhotoPreview } from "./PiecePhotoPreview.jsx";
import { StorefrontHeader } from "./Storefront.jsx";
import { RelatedPieces } from "./RelatedPieces.jsx";

export function PieceDetailPage({ piece }) {
  const [expandedPhoto, setExpandedPhoto] = useState(null);
  const dialog = useRef(null);
  const sold = piece.status === "sold";
  const reference = piece.status === "reference";
  const price = piece.status === "available" ? piecePrice(piece) : null;
  const orderUrl = `${commissionsUrl}&${piece.photoUrl ? "referenciaPublicada" : "referencia"}=${encodeURIComponent(pieceSlug(piece))}`;
  const photos = [{ image: piece.image, alt: piece.alt, url: piece.photoUrl }, ...(piece.photos ?? [])];

  function openPhoto(index) {
    setExpandedPhoto(index);
    dialog.current.showModal();
  }

  return <div className="storefront">
    <StorefrontHeader />
    <main className="storefront-wrap storefront-detail-page">
      <a className="text-link" href={price ? "/#disponiveis" : "/?pagina=referencias"}>
        {price ? "← Peças disponíveis" : "← Ver referências"}
      </a>
      <article className="storefront-detail" aria-labelledby="piece-title">
        <header className="storefront-detail-heading">
          <h1 id="piece-title">{piece.name}</h1>
          {piece.details && <p>{piece.details}</p>}
        </header>
        <div className="storefront-detail-photos">
          <PiecePhotoPreview photos={photos} onOpen={openPhoto} />
          {photos.length > 1 && <div className="storefront-photo-thumbnails">
            {photos.slice(1).map((photo, index) => <button className="storefront-zoom" type="button"
              key={photo.url ?? photo.image} aria-label={`Ampliar foto: ${photo.alt}`} onClick={() => openPhoto(index + 1)}>
              <img src={photo.url ?? `/portfolio/${photo.image}`} alt="" />
            </button>)}
          </div>}
        </div>
        <div className={`storefront-purchase ${price ? "storefront-purchase-available" : ""}`}>
          <p className="storefront-piece-status">{sold ? "Vendida" : price ? "Disponível" : piece.availability ?? pieceAvailability(piece)}</p>
          {price && <p className="storefront-purchase-price">{price}</p>}
          {!price && !sold && !reference && <p className="storefront-purchase-inquiry">Preço sob consulta</p>}
          {!sold && <a className="storefront-button" href={price ? `${orderUrl}&comprar=1` : orderUrl}>
            {price ? "Comprar esta peça" : "Encomendar com esta referência"}
          </a>}
          {price && <p className="storefront-purchase-note">Compra combinada pelo Instagram.</p>}
        </div>
        <section className="storefront-piece-specs" aria-labelledby="piece-specs-title">
          <h2 id="piece-specs-title">Detalhes da peça</h2>
          <dl>
            {piece.format && <div><dt>Tipo</dt><dd>{piece.format}</dd></div>}
            <div><dt>Medidas</dt><dd>{piece.measurements || "Sob consulta"}</dd></div>
            {piece.capacity && <div><dt>Capacidade</dt><dd>{piece.capacity}</dd></div>}
            {piece.material && <div><dt>Material</dt><dd>{piece.material}</dd></div>}
            {piece.origin && <div><dt>Origem</dt><dd>{piece.origin}</dd></div>}
          </dl>
        </section>
      </article>
      <RelatedPieces piece={piece} />
      <PhotoViewer dialog={dialog} photos={photos} index={expandedPhoto} onSelect={setExpandedPhoto} onClose={() => setExpandedPhoto(null)} />
    </main>
  </div>;
}
