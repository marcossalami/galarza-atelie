import { useState } from "react";

const resting = { index: 0, zoom: false, x: 50, y: 50 };

export function PiecePhotoPreview({ photos, onOpen }) {
  const [view, setView] = useState(resting);
  const [loaded, setLoaded] = useState(() => new Set());
  const photoSource = (photo) => photo.url ?? `/portfolio/${photo.image}`;
  const visible = loaded.has(photoSource(photos[view.index])) ? view.index : 0;

  function explore(event) {
    if (event.pointerType !== "mouse") return;
    const box = event.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (event.clientX - box.left) / box.width));
    const y = Math.max(0, Math.min(1, (event.clientY - box.top) / box.height));
    if (photos.length > 1 && (x < 0.25 || x > 0.75)) {
      const position = x < 0.25 ? x * 2 : 0.5 + (x - 0.75) * 2;
      const index = Math.min(photos.length - 1, Math.floor(position * photos.length));
      setView({ ...resting, index });
      return;
    }
    setView((previous) => ({ index: previous.index, zoom: true, x: x * 100, y: y * 100 }));
  }

  return <button className="storefront-zoom storefront-inspection" type="button"
    aria-label={`Ampliar foto: ${photos[visible].alt}`}
    data-angle={visible} data-zoomed={view.zoom}
    onPointerMove={explore} onPointerLeave={() => setView(resting)}
    onPointerCancel={() => setView(resting)} onClick={() => {
      onOpen(visible);
      setView(resting);
    }}>
    {photos.map((photo, index) => <img key={photoSource(photo)} src={photoSource(photo)}
      alt="" aria-hidden="true" decoding="async" fetchPriority={index === 0 ? "high" : undefined}
      data-active={index === visible}
      style={{
        transformOrigin: `${view.x}% ${view.y}%`,
        "--inspection-x": photos.length === 1 ? `${(50 - view.x) * 0.06}px` : "0px",
        "--inspection-y": photos.length === 1 ? `${(50 - view.y) * 0.06}px` : "0px",
      }}
      onLoad={() => setLoaded((previous) => new Set(previous).add(photoSource(photo)))} />)}
    <span>Ampliar foto</span>
  </button>;
}
