import { useEffect, useState } from "react";
import { preparePhoto, requestJson } from "./adminRequests.js";
import { portfolioItems } from "../content/siteContent.js";
import { AdminHeader, adminSections } from "./AdminPanel.jsx";
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
    <button type="button" disabled={index === 0} aria-label={`Subir ${label}`} onClick={() => move(-1)}>↑ Subir</button>
    <button type="button" disabled={index === count - 1} aria-label={`Descer ${label}`} onClick={() => move(1)}>↓ Descer</button>
  </>;
}

export function HomeAdmin({ initialSection }) {
  const [saved, setSaved] = useState(null);
  const [draft, setDraft] = useState(null);
  const [pieces, setPieces] = useState([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [section, setSection] = useState(
    initialSection === "previa" || adminSections.some(({ id }) => id === initialSection) ? initialSection : "capa",
  );
  const [mobile, setMobile] = useState(true);
  const dirty = Boolean(draft && draft !== saved?.draft);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

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
        save: "Alterações salvas. Você pode voltar para continuar mais tarde.",
        publish: "Alterações publicadas.",
        restore: "Versão anterior restaurada. Seu rascunho continua disponível.",
      }[action]);
      return true;
    } catch (reason) {
      setError(reason.message);
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function openPreview() {
    if (!dirty || await submit("save")) setSection("previa");
  }

  const originalPhoto = `/portfolio/${portfolioItems[0].image}`;
  const approvedPhoto = "/galarza-capa-acervo.jpg";
  const cover = draft?.cover === "upload" ? `data:image/jpeg;base64,${draft.photo}`
    : draft?.cover === "approved" ? approvedPhoto : originalPhoto;
  const title = adminSections.find(({ id }) => id === section)?.title ?? "Conferir e publicar";
  return <div className="admin-shell">
    <AdminHeader />
    <main className="admin-page admin-editor">
      <nav className="admin-editor-nav" aria-label="Partes da página inicial">
        {adminSections.map(({ id, title: label }) => <button key={id} type="button"
          aria-current={section === id ? "page" : undefined} onClick={() => setSection(id)}>{label}</button>)}
        <button type="button" aria-current={section === "previa" ? "page" : undefined}
          disabled={busy || !draft} onClick={openPreview}>Conferir e publicar</button>
      </nav>
      <div className="admin-title">
        <h1>{title}</h1>
        {error && <p role="alert">{error}</p>}
        {message && <p role="status">{message}</p>}
        {!draft && !error && <p role="status">Carregando…</p>}
      </div>
      {draft && <>
        {section === "capa" && <fieldset className="admin-surface" disabled={busy}>
          <legend className="admin-visually-hidden">Escolher a foto de capa</legend>
          <img className="home-editor-cover" src={cover} alt="Foto de capa selecionada" />
          <div className="admin-cover-options">
            {[["approved", "Foto do acervo", approvedPhoto], ["original", "Foto original", originalPhoto]].map(([id, label, image]) =>
              <button key={id} type="button" className="admin-photo-choice" aria-pressed={draft.cover === id}
                onClick={() => edit({ cover: id, photo: null })}>
                <img src={image} alt="" />
                <span>{label}</span>
                {draft.cover === id && <span className="admin-chip">Selecionada</span>}
              </button>)}
            <label className="admin-upload">
              <span>＋ Enviar foto</span>
              <input aria-label="Enviar foto de capa" type="file" accept="image/*" onChange={upload} />
            </label>
          </div>
        </fieldset>}
        {section === "secoes" && <fieldset className="admin-surface" disabled={busy}>
          <legend className="admin-visually-hidden">Organizar as seções</legend>
          <p className="admin-hint">A capa fica no topo. Escolha a ordem das seções abaixo.</p>
          <ol className="admin-ordered">
            {draft.sections.map((item, index) => <li key={item.id}>
              <div><strong>{labels[item.id]}</strong><span className="admin-row-status">{item.visible ? "Visível na página" : "Oculta na página"}</span></div>
              <div className="admin-row-actions">
                <MoveButtons index={index} count={draft.sections.length} label={labels[item.id]}
                  move={(delta) => edit({ sections: order(draft.sections, index, delta) })} />
                <button type="button" aria-label={`${item.visible ? "Ocultar" : "Mostrar"} ${labels[item.id]}`}
                  onClick={() => edit({ sections: draft.sections.map((entry) => entry.id === item.id ? { ...entry, visible: !entry.visible } : entry) })}>
                  {item.visible ? "Ocultar" : "Mostrar"}
                </button>
              </div>
            </li>)}
          </ol>
        </fieldset>}
        {section === "destaques" && <fieldset className="admin-surface" disabled={busy}>
          <legend className="admin-visually-hidden">Escolher peças em destaque</legend>
          {!pieces.length ? <div className="admin-empty">
            <strong>Nenhuma peça disponível para destacar</strong>
            <p>Cadastre e publique uma peça para ela aparecer aqui.</p>
            <a className="admin-primary" href="/gestao?editar=pecas">Ir para minhas peças</a>
          </div> : <>
            {draft.highlights.length > 0 && <ol className="admin-ordered">
              {draft.highlights.map((id, index) => {
                const piece = pieces.find((item) => item.id === id);
                const name = piece?.name ?? "Peça indisponível";
                return <li key={id}>
                  {piece && <img className="admin-piece-thumb" src={`/api/pecas/${id}/foto`} alt="" />}
                  <strong>{name}</strong>
                  <div className="admin-row-actions">
                    <MoveButtons index={index} count={draft.highlights.length} label={name}
                      move={(delta) => edit({ highlights: order(draft.highlights, index, delta) })} />
                    <button type="button" aria-label={`Retirar ${name} dos destaques`}
                      onClick={() => edit({ highlights: draft.highlights.filter((item) => item !== id) })}>Retirar</button>
                  </div>
                </li>;
              })}
            </ol>}
            {pieces.some(({ id }) => !draft.highlights.includes(id)) && <label className="admin-select">Adicionar uma peça
              <select value="" disabled={draft.highlights.length >= 100} onChange={(event) =>
                edit({ highlights: [...draft.highlights, event.currentTarget.value] })}>
                <option value="" disabled>Escolher peça disponível</option>
                {pieces.filter(({ id }) => !draft.highlights.includes(id))
                  .map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
              </select>
            </label>}
          </>}
        </fieldset>}
        {section !== "previa" && <div className="admin-action-bar">
          <p>{dirty ? "Tem alterações para salvar." : "As mudanças só aparecem na loja depois de publicar."}</p>
          <div>
            <button type="button" disabled={busy || !dirty} onClick={() => submit("save")}>Salvar para depois</button>
            <button type="button" className="admin-primary" disabled={busy} onClick={openPreview}>
              {dirty ? "Salvar e conferir" : "Conferir página"}
            </button>
          </div>
        </div>}
        {section === "previa" && <section className="home-preview admin-surface" aria-label="Prévia da página inicial">
          <div className="admin-preview-tools">
            <div className="admin-row-actions" aria-label="Tamanho da prévia">
              <button type="button" aria-pressed={mobile} onClick={() => setMobile(true)}>Celular</button>
              <button type="button" aria-pressed={!mobile} onClick={() => setMobile(false)}>Computador</button>
            </div>
            <button type="button" className="admin-primary" disabled={busy}
              onClick={() => { if (window.confirm("Publicar as alterações na loja de prévia?")) submit("publish"); }}>Publicar alterações</button>
          </div>
          <div className="home-preview-scroll">
            <iframe key={saved.revision} title="Prévia da página inicial" src="/gestao?ver=inicio"
              className={mobile ? "home-preview-mobile" : "home-preview-desktop"} />
          </div>
          {saved.canRestore && <details className="admin-restore">
            <summary>Histórico da página</summary>
            <button type="button" disabled={busy}
              onClick={() => { if (window.confirm("Publicar novamente a versão anterior da página inicial?")) submit("restore"); }}>
              Restaurar versão anterior
            </button>
          </details>}
        </section>}
      </>}
    </main>
  </div>;
}
