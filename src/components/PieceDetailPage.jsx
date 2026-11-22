import { useRef, useState } from "react";
import { pieceAvailability, piecePrice } from "../content/catalog.js";
import { ContactActions } from "./CommissionPage.jsx";
import { StorefrontHeader } from "./Storefront.jsx";

export function PieceDetailPage({ piece }) {
  const [expandedPhoto, setExpandedPhoto] = useState(null);
  const dialog = useRef(null);
  const sold = piece.status === "sold";
  const price = piece.status === "available" ? piecePrice(piece) : null;
  const message = `Oi! Gostaria de saber mais sobre a peça ${piece.name}.`;
  const photos = [{ image: piece.image, alt: piece.alt }, ...(piece.photos ?? [])];

  return <div className="storefront">
    <StorefrontHeader />
    <main className="storefront-wrap storefront-section">
      <a className="text-link" href="/?pagina=referencias">← Ver referências</a>
      <article className="storefront-detail">
        <div className="storefront-detail-photos">
          {photos.map((photo) => <button className="storefront-zoom" type="button" key={photo.image} onClick={() => {
            setExpandedPhoto(photo);
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
          {!sold && <ContactActions message={message} />}
        </div>
      </article>
      <dialog className="storefront-photo-dialog" ref={dialog} aria-label="Foto ampliada" onClose={() => setExpandedPhoto(null)}>
        <form method="dialog"><button className="storefront-button">Fechar foto</button></form>
        {expandedPhoto && <img src={`/portfolio/${expandedPhoto.image}`} alt={expandedPhoto.alt} />}
      </dialog>
    </main>
  </div>;
}
