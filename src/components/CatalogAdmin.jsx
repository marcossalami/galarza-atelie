import { useEffect, useState } from "react";
import { PieceDetailPage } from "./PieceDetailPage.jsx";
import { preparePhoto, requestJson } from "./adminRequests.js";
import { AdminHeader } from "./AdminPanel.jsx";
import "./catalog-admin.css";

const endpoint = "/api/gestao/pecas";
const blank = { name: "", format: "", measurements: "", price: "", photo: null, status: "draft" };
const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const labels = { available: "Disponível", reference: "Referência", draft: "Rascunho", sold: "Vendida" };

function pieceStatus(piece) {
  return piece.published ? "available" : piece.reference ? "reference" : piece.sold ? "sold" : "draft";
}

function PieceCard({ piece, photo }) {
  return (
    <article className="piece-preview">
      {photo && <img src={photo} alt={piece.name || "Foto da peça"} />}
      <h2>{piece.name || "Peça sem nome"}</h2>
      {piece.format && <p>{piece.format}</p>}
      {piece.measurements && <p>{piece.measurements}</p>}
      {piece.status === "available" && piece.price !== null && <p>{currency.format(piece.price / 100)}</p>}
    </article>
  );
}

export function CatalogAdmin() {
  const [items, setItems] = useState(null);
  const [piece, setPiece] = useState(blank);
  const [editing, setEditing] = useState(false);
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
    setEditing(true);
    setPiece(item ? { ...item, status: pieceStatus(item), price: item.price === null ? "" : String(item.price / 100).replace(".", ","), photo: null } : blank);
    setError("");
    setMessage("");
  }

  const price = piece.price.trim();
  const cents = /^\d{1,6}(?:[,.]\d{1,2})?$/.test(price) ? Math.round(Number(price.replace(",", ".")) * 100) : null;
  const photo = piece.photo ? `data:image/jpeg;base64,${piece.photo}`
    : piece.hasPhoto ? `${endpoint}/${piece.id}/foto?v=${piece.revision}` : null;
  const original = items?.find(({ id }) => id === piece.id);
  const hasEdits = original && (piece.name !== original.name || piece.format !== original.format ||
    piece.measurements !== original.measurements || piece.status !== pieceStatus(original) ||
    cents !== original.price || Boolean(piece.photo));
  const unsaved = editing && (original ? hasEdits : Boolean(piece.name || piece.format || piece.measurements || piece.price || piece.photo || piece.status !== "draft"));

  function backToList() {
    if (unsaved && !window.confirm("Voltar à lista sem salvar as alterações desta peça?")) return;
    setEditing(false);
    setError("");
    setMessage("");
  }

  useEffect(() => {
    if (!unsaved) return;
    const warn = (event) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [unsaved]);

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
    setMessage("");
    setError("");
    if (price && !cents) return setError("Informe um preço válido em reais.");
    if (piece.status !== "draft" && (!piece.name.trim() || !piece.format.trim() || !photo)) {
      return setError("Preencha nome, tipo e foto para mostrar a peça na loja.");
    }
    if (piece.status === "available" && !cents) return setError("Informe o preço para colocar a peça à venda.");
    setBusy(true);
    try {
      const saved = await requestJson(piece.id ? `${endpoint}/${piece.id}` : endpoint, {
        method: piece.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...piece, price: cents }),
      });
      setItems((current) => current.some((item) => item.id === saved.id)
        ? current.map((item) => item.id === saved.id ? saved : item)
        : [saved, ...current]);
      select(saved);
      setMessage(`Peça salva · ${labels[pieceStatus(saved)]}.`);
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

  return (
    <div className="admin-shell">
    <AdminHeader />
    <main className="admin-page">
      <div className="admin-title">
        {editing && <button type="button" className="admin-back" disabled={busy} onClick={backToList}>← Voltar para minhas peças</button>}
        <h1>{editing ? (piece.id ? "Editar peça" : "Nova peça") : "Minhas peças"}</h1>
      </div>
      {error && <p role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}
      {items && !editing && <div className="admin-surface admin-catalog-list">
        <button type="button" className="admin-primary" onClick={() => select(null)}>＋ Adicionar peça</button>
        {!items.length && <p>Você ainda não cadastrou nenhuma peça.</p>}
        {items.length > 0 && <ul className="admin-ordered">
          {items.map((item) => <li key={item.id}>
            {item.hasPhoto && <img className="admin-piece-thumb" src={`${endpoint}/${item.id}/foto?v=${item.revision}`} alt="" />}
            <div><strong>{item.name || "Peça sem nome"}</strong>
              <span className="admin-row-status">{labels[pieceStatus(item)]}</span></div>
            <button type="button" aria-label={`Editar ${item.name || "peça sem nome"}`} onClick={() => select(item)}>Editar</button>
          </li>)}
        </ul>}
      </div>}
      {items && editing && <div className="admin-piece-layout">
        <form className="admin-surface" onSubmit={save}>
          <fieldset disabled={busy}>
            <legend className="admin-visually-hidden">Dados da peça</legend>
            <label>Nome<input maxLength={100} value={piece.name} onChange={(event) => setPiece({ ...piece, name: event.target.value })} /></label>
            <label>Tipo<input maxLength={50} placeholder="Ex.: Copo, Caneca, Bowl" value={piece.format} onChange={(event) => setPiece({ ...piece, format: event.target.value })} /></label>
            <label>Preço em reais<input inputMode="decimal" maxLength={9} value={piece.price} onChange={(event) => setPiece({ ...piece, price: event.target.value })} /></label>
            <label>Tamanho<input maxLength={100} placeholder="Ex.: 9 cm de altura ou 250 ml" value={piece.measurements}
              onChange={(event) => setPiece({ ...piece, measurements: event.target.value })} /></label>
            <label>Situação<select value={piece.status} onChange={(event) => setPiece({ ...piece, status: event.target.value })}>
              <option value="draft">Rascunho</option>
              <option value="available">Disponível para venda</option>
              <option value="reference">Referência para encomendas</option>
              <option value="sold">Vendida</option>
            </select></label>
            <p className="admin-hint">{{
              draft: "Só você pode ver esta peça.",
              available: "A peça aparece na vitrine com o preço.",
              reference: "A peça aparece na galeria de referências, sem preço público.",
              sold: "A peça sai da vitrine. Quem tiver o link vê que foi vendida.",
            }[piece.status]}</p>
            <label>Foto<input type="file" accept="image/*" onChange={changePhoto} /></label>
            <button className="admin-primary" type="submit">Salvar peça</button>
          </fieldset>
        </form>
        <section className="admin-surface admin-piece-preview" aria-label="Prévia da peça">
          <p>Como a peça aparece na loja</p>
          <PieceCard piece={{ ...piece, price: cents }} photo={photo} />
          {original && pieceStatus(original) !== "draft" && <a href={`/?publicada=${piece.id}`}>Ver na loja ↗</a>}
        </section>
      </div>}
      {!items && !error && <p role="status">Carregando peças…</p>}
    </main>
    </div>
  );
}

export function PublishedPiece({ id, fallback }) {
  const [piece, setPiece] = useState(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    const request = new AbortController();
    fetch(`/api/pecas/${encodeURIComponent(id)}`, { signal: request.signal })
      .then(async (response) => {
        if (fallback && !response.headers.get("Content-Type")?.includes("application/json") &&
            (response.ok || response.status === 404)) {
          setPiece({ legacy: true });
          return;
        }
        if (!response.ok) throw new Error("Peça indisponível");
        setPiece(await response.json());
      }).catch(() => { if (!request.signal.aborted) setError(true); });
    return () => request.abort();
  }, [id, fallback]);
  if (piece?.legacy) return <PieceDetailPage piece={fallback} />;
  if (piece) {
    return <PieceDetailPage piece={{ ...piece, alt: piece.name, photoUrl: `/api/pecas/${piece.id}/foto`,
      photos: piece.angles?.map(({ position, alt }) => ({ url: `/api/pecas/${piece.id}/foto/${position}`, alt })),
      status: pieceStatus({ ...piece, published: !piece.reference && !piece.sold }),
      availability: piece.reference ? "Referência para encomendas" : undefined, priceInCents: piece.price, slug: piece.id }} />;
  }
  return <main className="catalog-management">
    <a href="/">Galarza Ateliê</a>
    {error && <h1>Peça indisponível</h1>}
    {!piece && !error && <p role="status">Carregando peça…</p>}
  </main>;
}
