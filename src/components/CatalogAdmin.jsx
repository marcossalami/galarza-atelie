import { useEffect, useState } from "react";
import { PieceDetailPage } from "./PieceDetailPage.jsx";
import { preparePhoto, requestJson } from "./adminRequests.js";
import "./catalog-admin.css";

const endpoint = "/api/gestao/pecas";
const blank = { name: "", format: "", price: "", photo: null };
const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function PieceCard({ piece, photo }) {
  return (
    <article className="piece-preview">
      {photo && <img src={photo} alt={piece.name || "Foto da peça"} />}
      <h2>{piece.name || "Peça sem nome"}</h2>
      {piece.format && <p>{piece.format}</p>}
      {piece.price !== null && <p>{currency.format(piece.price / 100)}</p>}
    </article>
  );
}

export function CatalogAdmin() {
  const [items, setItems] = useState(null);
  const [piece, setPiece] = useState(blank);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    requestJson(endpoint).then(
      (data) => { if (active) setItems(data); },
      (reason) => { if (active) setError(reason.message); },
    );
    return () => { active = false; };
  }, []);

  function select(item) {
    setPiece(item ? { ...item, price: item.price === null ? "" : String(item.price / 100).replace(".", ","), photo: null } : blank);
    setError("");
    setMessage("");
  }

  const price = piece.price.trim();
  const cents = /^\d{1,6}(?:[,.]\d{1,2})?$/.test(price) ? Math.round(Number(price.replace(",", ".")) * 100) : null;
  const photo = piece.photo ? `data:image/jpeg;base64,${piece.photo}`
    : piece.hasPhoto ? `${endpoint}/${piece.id}/foto?v=${piece.revision}` : null;
  const original = items?.find(({ id }) => id === piece.id);
  const hasEdits = original && (piece.name !== original.name || piece.format !== original.format ||
    cents !== original.price || Boolean(piece.photo));

  async function changePhoto(event) {
    const file = event.target.files[0];
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const image = await preparePhoto(file);
      setPiece((current) => ({ ...current, photo: image }));
    } catch (reason) {
      setError(reason.message || "Não foi possível abrir a foto.");
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  }

  async function save(event) {
    event.preventDefault();
    const publish = event.nativeEvent.submitter?.value === "publish" || Boolean(piece.published);
    setMessage("");
    setError("");
    if (price && !cents) return setError("Informe um preço válido em reais.");
    if ((publish || piece.sold) && (!piece.name.trim() || !piece.format.trim() || !cents || !photo)) {
      return setError("Informe nome, formato, preço e foto para manter a página pública da peça.");
    }
    setBusy(true);
    try {
      const saved = await requestJson(piece.id ? `${endpoint}/${piece.id}` : endpoint, {
        method: piece.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...piece, price: cents, publish }),
      });
      setItems((current) => current.some((item) => item.id === saved.id)
        ? current.map((item) => item.id === saved.id ? saved : item)
        : [saved, ...current]);
      select(saved);
      setMessage(saved.published ? "Peça publicada." : saved.sold ? "Peça vendida atualizada." : "Rascunho salvo.");
    } catch (reason) {
      setError(reason.message);
      if (reason.cause === 409) {
        try {
          setItems(await requestJson(endpoint));
        } catch {
          setError("Sua edição ficou nesta tela. Para reabrir a versão atual, recarregue a página.");
        }
      }
    } finally {
      setBusy(false);
    }
  }

  async function changeAvailability(action) {
    if (hasEdits && !window.confirm("Descartar as edições desta peça e alterar a disponibilidade?")) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const saved = await requestJson(`${endpoint}/${piece.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, revision: piece.revision }),
      });
      setItems((current) => current.map((item) => item.id === saved.id ? saved : item));
      select(saved);
      setMessage(saved.sold ? "Peça marcada como vendida." : "Peça retirada da vitrine.");
    } catch (reason) {
      setError(reason.message);
      if (reason.cause === 409) {
        try {
          setItems(await requestJson(endpoint));
        } catch {
          setError("Recarregue a página para abrir a versão atual da peça.");
        }
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="catalog-management">
      <header>
        <h1>Gerenciar peças</h1>
        <form action="/gestao/sair" method="post"><button type="submit">Sair</button></form>
      </header>
      <nav aria-label="Gestão"><a href="/gestao?editar=inicio">Editar página inicial</a></nav>
      {error && <p role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}
      {items && <>
        <div className="piece-picker">
          <button disabled={busy} onClick={() => select(null)}>Nova peça</button>
          {items.map((item) => <button key={item.id} disabled={busy} onClick={() => select(item)}>
            {item.name || "Peça sem nome"} · {item.published ? "Publicada" : item.sold ? "Vendida" : "Rascunho"}
          </button>)}
        </div>
        <form onSubmit={save}>
          <fieldset disabled={busy}>
            <legend>{piece.id ? "Editar peça" : "Nova peça"}</legend>
            <label>Nome<input maxLength={100} value={piece.name} onChange={(event) => setPiece({ ...piece, name: event.target.value })} /></label>
            <label>Formato<input maxLength={50} value={piece.format} onChange={(event) => setPiece({ ...piece, format: event.target.value })} /></label>
            <label>Preço em reais<input inputMode="decimal" maxLength={9} value={piece.price} onChange={(event) => setPiece({ ...piece, price: event.target.value })} /></label>
            <label>Foto<input type="file" accept="image/*" onChange={changePhoto} /></label>
            {!piece.published && <button type="submit" value="draft">{piece.sold ? "Salvar peça vendida" : "Salvar rascunho"}</button>}
            <button type="submit" value="publish">{piece.published ? "Salvar alterações" : piece.sold ? "Voltar à vitrine" : "Publicar"}</button>
          </fieldset>
        </form>
        <section aria-label="Prévia do cartão">
          <p>Prévia do cartão</p>
          <PieceCard piece={{ ...piece, price: cents }} photo={photo} />
        </section>
        {(piece.published === 1 || piece.sold === 1) && <a href={`/?publicada=${piece.id}`}>Ver página pública</a>}
        {piece.published === 1 && <div className="piece-picker">
          <button disabled={busy} onClick={() => changeAvailability("withdraw")}>Retirar da vitrine</button>
          <button disabled={busy} onClick={() => changeAvailability("sold")}>Marcar como vendida</button>
        </div>}
      </>}
      {!items && !error && <p role="status">Carregando peças…</p>}
    </main>
  );
}

export function PublishedPiece({ id }) {
  const [piece, setPiece] = useState(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    requestJson(`/api/pecas/${encodeURIComponent(id)}`).then(
      (data) => { if (active) setPiece(data); },
      () => { if (active) setError(true); },
    );
    return () => { active = false; };
  }, [id]);
  if (piece) {
    return <PieceDetailPage piece={{ ...piece, alt: piece.name, photoUrl: `/api/pecas/${piece.id}/foto`,
      status: piece.sold ? "sold" : "available", priceInCents: piece.price, slug: piece.id }} />;
  }
  return <main className="catalog-management">
    <a href="/">Galarza Ateliê</a>
    {error && <h1>Peça indisponível</h1>}
    {!piece && !error && <p role="status">Carregando peça…</p>}
  </main>;
}
