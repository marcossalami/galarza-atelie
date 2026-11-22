import { useEffect, useRef, useState } from "react";

const initial = { scale: 1, x: 0, y: 0 };
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const gap = ([first, second]) => Math.hypot(first.x - second.x, first.y - second.y);

export function PhotoViewer({ dialog, photos, index, onSelect, onClose }) {
  const stage = useRef(null);
  const image = useRef(null);
  const pointers = useRef(new Map());
  const dragging = useRef(null);
  const [view, setView] = useState(initial);
  const [moving, setMoving] = useState(false);
  const photo = photos[index];

  function reset() {
    pointers.current.clear();
    dragging.current = null;
    setMoving(false);
    setView(initial);
  }

  function changePhoto(offset) {
    reset();
    onSelect((index + offset + photos.length) % photos.length);
  }

  function bounded(scale, x, y) {
    const limitX = Math.max(0, (image.current.offsetWidth * scale - stage.current.clientWidth) / 2);
    const limitY = Math.max(0, (image.current.offsetHeight * scale - stage.current.clientHeight) / 2);
    return { scale, x: clamp(x, -limitX, limitX), y: clamp(y, -limitY, limitY) };
  }

  useEffect(() => {
    const surface = stage.current;
    if (!surface) return;
    function wheel(event) {
      event.preventDefault();
      setView((current) => bounded(clamp(current.scale * Math.exp(-event.deltaY / 450), 1, 4), current.x, current.y));
    }
    surface.addEventListener("wheel", wheel, { passive: false });
    return () => surface.removeEventListener("wheel", wheel);
  }, [photo]);

  function move(event) {
    const previous = pointers.current.get(event.pointerId);
    if (!previous) return;
    const before = [...pointers.current.values()];
    const current = { x: event.clientX, y: event.clientY };
    pointers.current.set(event.pointerId, current);
    if (before.length === 2 && gap(before) >= 1) {
      const ratio = gap([...pointers.current.values()]) / gap(before);
      setView((old) => bounded(clamp(old.scale * ratio, 1, 4), old.x, old.y));
    } else if (before.length === 1) {
      setView((old) => bounded(old.scale, old.x + current.x - previous.x, old.y + current.y - previous.y));
    }
  }

  function release(event, allowSwipe) {
    const start = dragging.current;
    pointers.current.delete(event.pointerId);
    if (pointers.current.size) return;
    if (allowSwipe && start && view.scale === 1 && photos.length > 1 &&
      Math.abs(event.clientX - start.x) > 52 &&
      Math.abs(event.clientX - start.x) > Math.abs(event.clientY - start.y)) {
      changePhoto(event.clientX < start.x ? 1 : -1);
    }
    dragging.current = null;
    setMoving(false);
  }

  function zoom(step) {
    setView((current) => bounded(clamp(current.scale + step, 1, 4), current.x, current.y));
  }

  return <dialog className="storefront-photo-dialog" ref={dialog} aria-label="Foto ampliada"
    onClose={() => { reset(); onClose(); }}
    onKeyDown={(event) => {
      if (photos.length < 2 || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
      event.preventDefault();
      changePhoto(event.key === "ArrowLeft" ? -1 : 1);
    }}>
    <form method="dialog"><button className="storefront-button">Fechar foto</button></form>
    {photo && <>
      <div className="storefront-photo-stage" ref={stage} data-moving={moving} data-zoomed={view.scale > 1}
        onPointerDown={(event) => {
          if (event.button !== 0 || pointers.current.size >= 2) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          const point = { x: event.clientX, y: event.clientY };
          dragging.current = pointers.current.size ? null : point;
          pointers.current.set(event.pointerId, point);
          setMoving(true);
        }}
        onPointerMove={move}
        onPointerUp={(event) => release(event, true)}
        onPointerCancel={(event) => release(event, false)}>
        <img key={photo.image} ref={image} src={`/portfolio/${photo.image}`} alt={photo.alt} draggable={false}
          style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` }} />
      </div>
      <div className="storefront-photo-tools">
        <button type="button" onClick={() => zoom(-0.5)} disabled={view.scale <= 1}>Afastar</button>
        <button type="button" onClick={() => zoom(0.5)} disabled={view.scale >= 4}>Aproximar</button>
        <button type="button" onClick={() => setView(initial)}>Ajustar</button>
      </div>
      {photos.length > 1 && <div className="storefront-photo-tools">
        <button type="button" onClick={() => changePhoto(-1)}>Anterior</button>
        <span aria-live="polite">{index + 1} / {photos.length}</span>
        <button type="button" onClick={() => changePhoto(1)}>Próxima</button>
      </div>}
    </>}
  </dialog>;
}
