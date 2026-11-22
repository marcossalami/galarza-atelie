import { useEffect, useState } from "react";
import { preparePhoto, requestJson } from "./adminRequests.js";
import { portfolioItems } from "../content/siteContent.js";
import "./catalog-admin.css";

const endpoint = "/api/gestao/inicio";
const labels = { available: "Peças disponíveis", references: "Referências" };

function order(items, index, delta) {
  const next = [...items];
  [next[index], next[index + delta]] = [next[index + delta], next[index]];
  return next;
}

function MoveButtons({ index, count, label, move }) {
  return <>
    <button type="button" disabled={index === 0} aria-label={`Subir ${label}`} onClick={() => move(-1)}>↑</button>
    <button type="button" disabled={index === count - 1} aria-label={`Descer ${label}`} onClick={() => move(1)}>↓</button>
  </>;
}

export function HomeAdmin() {
  const [saved, setSaved] = useState(null);
  const [draft, setDraft] = useState(null);
  const [pieces, setPieces] = useState([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(false);
  const [mobile, setMobile] = useState(true);
  const dirty = draft !== saved?.draft;

  useEffect(() => {
    const request = new AbortController();
    const options = { signal: request.signal };
    Promise.all([requestJson(endpoint, options), requestJson("/api/pecas", options)])
      .then(([home, catalog]) => {
        setSaved(home);
        setDraft(home.draft);
        setPieces(catalog);
      })
      .catch((reason) => { if (!request.signal.aborted) setError(reason.message); });
    return () => request.abort();
  }, []);

  function edit(fields) {
    setDraft((current) => ({ ...current, ...fields }));
    setMessage("");
    setError("");
  }

  async function upload(event) {
    const input = event.currentTarget;
    const file = input.files[0];
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      edit({ cover: "upload", photo: await preparePhoto(file, 450_000) });
    } catch (reason) {
      setError(reason.message || "Não foi possível abrir a foto.");
    } finally {
      setBusy(false);
      input.value = "";
    }
  }

  async function submit(action) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const home = await requestJson(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, revision: saved.revision, ...(action === "save" ? { draft } : {}) }),
      });
      setSaved(home);
      setDraft(home.draft);
      setMessage({
        save: "Rascunho salvo.",
        publish: "Alterações publicadas.",
        restore: "Versão anterior restaurada. Seu rascunho continua disponível.",
      }[action]);
    } catch (reason) {
      setError(reason.message);
    } finally {
      setBusy(false);
    }
  }

  const cover = draft?.cover === "upload" ? `data:image/jpeg;base64,${draft.photo}`
    : draft?.cover === "approved" ? "/galarza-capa-acervo.jpg" : `/portfolio/${portfolioItems[0].image}`;
  return <main className="catalog-management home-management">
    <header><h1>Editar página inicial</h1><a href="/gestao">Voltar para peças</a></header>
    {error && <p role="alert">{error}</p>}
    {message && <p role="status">{message}</p>}
    {!draft && !error && <p role="status">Carregando editor…</p>}
    {draft && <>
      <div className="home-editor">
        <fieldset disabled={busy}>
          <legend>Foto de capa</legend>
          <img className="home-editor-cover" src={cover} alt="Foto de capa selecionada" />
          <div className="piece-picker">
            <button aria-pressed={draft.cover === "approved"} onClick={() => edit({ cover: "approved", photo: null })}>Usar foto aprovada</button>
            <button aria-pressed={draft.cover === "original"} onClick={() => edit({ cover: "original", photo: null })}>Usar foto original</button>
          </div>
          <label>Enviar outra foto<input type="file" accept="image/*" onChange={upload} /></label>
        </fieldset>
        <div>
          <fieldset disabled={busy}>
            <legend>Ordem e visibilidade das seções</legend>
            {draft.sections.map((section, index) => <div key={section.id} className="home-editor-row">
              <label><input type="checkbox" checked={section.visible} onChange={(event) => {
                const visible = event.currentTarget.checked;
                edit({ sections: draft.sections.map((item) => item.id === section.id ? { ...item, visible } : item) });
              }} />{labels[section.id]}</label>
              <MoveButtons index={index} count={draft.sections.length} label={labels[section.id]}
                move={(delta) => edit({ sections: order(draft.sections, index, delta) })} />
            </div>)}
          </fieldset>
          <fieldset disabled={busy}>
            <legend>Peças em destaque</legend>
            {!pieces.length && <p>Publique uma peça para poder destacá-la aqui.</p>}
            {draft.highlights.map((id, index) => {
              const name = pieces.find((piece) => piece.id === id)?.name ?? "Peça indisponível";
              return <div className="home-editor-row" key={id}>
                <span>{name}</span>
                <MoveButtons index={index} count={draft.highlights.length} label={name}
                  move={(delta) => edit({ highlights: order(draft.highlights, index, delta) })} />
                <button aria-label={`Retirar ${name} dos destaques`}
                  onClick={() => edit({ highlights: draft.highlights.filter((item) => item !== id) })}>Retirar</button>
              </div>;
            })}
            {pieces.some(({ id }) => !draft.highlights.includes(id)) && <label>Adicionar peça em destaque
              <select value="" disabled={draft.highlights.length >= 100} onChange={(event) =>
                edit({ highlights: [...draft.highlights, event.currentTarget.value] })}>
                <option value="" disabled>Escolher peça disponível</option>
                {pieces.filter(({ id }) => !draft.highlights.includes(id))
                  .map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
              </select>
            </label>}
          </fieldset>
        </div>
      </div>
      <div className="piece-picker">
        <button disabled={busy || !dirty} onClick={() => submit("save")}>Salvar rascunho</button>
        <button disabled={busy || dirty} aria-expanded={preview} onClick={() => setPreview(!preview)}>{preview ? "Fechar prévia" : "Abrir prévia"}</button>
        <button disabled={busy || dirty} onClick={() => submit("publish")}>Publicar alterações</button>
        {saved.canRestore && <button disabled={busy || dirty}
          onClick={() => { if (window.confirm("Publicar novamente a versão anterior da página inicial?")) submit("restore"); }}>
          Restaurar versão anterior
        </button>}
        <a href="/" target="_blank" rel="noreferrer">Ver página publicada</a>
      </div>
      {dirty && <p>Salve o rascunho para conferir ou publicar sua edição.</p>}
      {preview && <section className="home-preview" aria-label="Prévia da página inicial">
        <div className="piece-picker" aria-label="Tamanho da prévia">
          <button aria-pressed={mobile} onClick={() => setMobile(true)}>Celular</button>
          <button aria-pressed={!mobile} onClick={() => setMobile(false)}>Computador</button>
          {dirty && <span>A prévia exibe o último rascunho salvo.</span>}
        </div>
        <div className="home-preview-scroll">
          <iframe key={saved.revision} title="Prévia da página inicial" src="/gestao?ver=inicio"
            className={mobile ? "home-preview-mobile" : "home-preview-desktop"} />
        </div>
      </section>}
    </>}
  </main>;
}
