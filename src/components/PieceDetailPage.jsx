import { useRef, useState } from "react";
import { pieceAvailability, piecePrice, pieceSlug } from "../content/catalog.js";
import { commissionsUrl } from "../content/siteContent.js";
import { PhotoViewer } from "./PhotoViewer.jsx";
import { StorefrontHeader } from "./Storefront.jsx";

export function PieceDetailPage({ piece }) {
  const [expandedPhoto, setExpandedPhoto] = useState(null);
  const dialog = useRef(null);
  const sold = piece.status === "sold";
  const price = piece.status === "available" ? piecePrice(piece) : null;
  const photos = [{ image: piece.image, alt: piece.alt }, ...(piece.photos ?? [])];

  return <div className="storefront">
    <StorefrontHeader />
    <main className="storefront-wrap storefront-section">
      <a className="text-link" href="/?pagina=referencias">← Ver referências</a>
      <article className="storefront-detail">
        <div className="storefront-detail-photos">
          {photos.map((photo, index) => <button className="storefront-zoom" type="button" key={photo.image} onClick={() => {
            setExpandedPhoto(index);
            dialog.current.showModal();
          }}>
            <img src={`/portfolio/${photo.image}`} alt={photo.alt} />
            <span>Ampliar foto</span>
          </button>)}
        </div>
        <div>
          <h1>{piece.name}</h1>
          <p>{sold ? "Vendida" : piece.availability ?? (price ? "Disponível" : pieceAvailability(piece))}</p>
          {piece.details && <p>{piece.details}</p>}
          <dl>
            {!sold && <><dt>Preço</dt><dd>{price ?? "Sob consulta"}</dd></>}
            {piece.material && <><dt>Material</dt><dd>{piece.material}</dd></>}
            {piece.origin && <><dt>Origem</dt><dd>{piece.origin}</dd></>}
            <dt>Medidas</dt><dd>{piece.measurements ?? "Sob consulta"}</dd>
            {piece.capacity && <><dt>Capacidade</dt><dd>{piece.capacity}</dd></>}
          </dl>
          {!sold && <a className="storefront-button" href={`${commissionsUrl}&referencia=${encodeURIComponent(pieceSlug(piece))}`}>
            Encomendar com esta referência
          </a>}
        </div>
      </article>
      <PhotoViewer dialog={dialog} photos={photos} index={expandedPhoto} onSelect={setExpandedPhoto} onClose={() => setExpandedPhoto(null)} />
    </main>
  </div>;
}
