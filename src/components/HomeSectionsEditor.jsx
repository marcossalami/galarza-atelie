import { builtInSections, customSectionLimit, galleryPieceLimit, sectionTextLimit, sectionTitleLimit } from "../content/homeSections.js";

export function moveItem(items, index, delta) {
  const next = [...items];
  [next[index], next[index + delta]] = [next[index + delta], next[index]];
  return next;
}

export function MoveButtons({ index, count, label, move }) {
  return <>
    <button type="button" disabled={index === 0} aria-label={`Subir ${label}`} onClick={() => move(-1)}>↑ Subir</button>
    <button type="button" disabled={index === count - 1} aria-label={`Descer ${label}`} onClick={() => move(1)}>↓ Descer</button>
  </>;
}

function GalleryEditor({ pieceIds, catalog, update }) {
  const names = new Map(catalog.map(({ id, name }) => [id, name]));
  const choices = catalog.filter(({ id }) => !pieceIds.includes(id));
  return <>
    {pieceIds.length > 0 && <ol className="admin-ordered">
      {pieceIds.map((id, index) => {
        const label = names.get(id) ?? "Peça fora da galeria";
        return <li key={id}>
          <strong>{label}</strong>
          <div className="admin-row-actions">
            <MoveButtons index={index} count={pieceIds.length} label={label}
              move={(delta) => update(moveItem(pieceIds, index, delta))} />
            <button type="button" aria-label={`Retirar ${label} da galeria`}
              onClick={() => update(pieceIds.filter((pieceId) => pieceId !== id))}>Retirar</button>
          </div>
        </li>;
      })}
    </ol>}
    <label className="admin-select">Adicionar à galeria
      <select value="" disabled={!choices.length || pieceIds.length >= galleryPieceLimit}
        onChange={(event) => update([...pieceIds, event.currentTarget.value])}>
        <option value="" disabled>Escolher uma peça</option>
        {choices.map(({ id, name, reference }) =>
          <option key={id} value={id}>{name} · {reference ? "Referência" : "À venda"}</option>)}
      </select>
    </label>
    {!catalog.length && <p className="admin-hint">Publique uma peça em Minhas peças para adicioná-la à galeria.</p>}
  </>;
}

export function HomeSectionsEditor({ sections, catalog, busy, onChange }) {
  const editSection = (id, fields) => onChange(sections.map((item) => item.id === id ? { ...item, ...fields } : item));
  const canAdd = sections.length < Object.keys(builtInSections).length + customSectionLimit;
  function add(kind) {
    const item = { id: crypto.randomUUID(), kind, visible: true, title: "", text: "" };
    onChange([...sections, kind === "gallery" ? { ...item, pieceIds: [] } : item]);
  }

  return <fieldset className="admin-surface" disabled={busy}>
    <legend className="admin-visually-hidden">Organizar as seções</legend>
    <p className="admin-hint">A capa fica no topo. Escolha a ordem das seções abaixo.</p>
    <div className="admin-row-actions">
      <button className="admin-primary" type="button" disabled={!canAdd} onClick={() => add("gallery")}>＋ Criar galeria</button>
      <button type="button" disabled={!canAdd} onClick={() => add("text")}>＋ Adicionar texto</button>
      {!canAdd && <span>Limite de {customSectionLimit} seções novas.</span>}
    </div>
    <ol className="admin-ordered admin-sections">
      {sections.map((item, index) => {
        const builtIn = Object.hasOwn(builtInSections, item.id);
        const label = builtIn ? builtInSections[item.id] : (item.title || (item.kind === "gallery" ? "Nova galeria" : "Novo texto"));
        return <li key={item.id}>
          <div><strong>{label}</strong><span className="admin-row-status">{item.visible ? "Visível na página" : "Oculta na página"}</span></div>
          <div className="admin-row-actions">
            <MoveButtons index={index} count={sections.length} label={label}
              move={(delta) => onChange(moveItem(sections, index, delta))} />
            <button type="button" aria-label={`${item.visible ? "Ocultar" : "Mostrar"} ${label}`}
              onClick={() => editSection(item.id, { visible: !item.visible })}>{item.visible ? "Ocultar" : "Mostrar"}</button>
            {!builtIn && <button type="button" aria-label={`Remover seção ${label}`}
              onClick={() => onChange(sections.filter(({ id }) => id !== item.id))}>Remover seção</button>}
          </div>
          {!builtIn && <div className="admin-section-content">
            <label>Título<input value={item.title} maxLength={sectionTitleLimit}
              onChange={(event) => editSection(item.id, { title: event.currentTarget.value })} /></label>
            <label>{item.kind === "gallery" ? "Legenda (opcional)" : "Texto curto"}
              <textarea rows={2} value={item.text} maxLength={sectionTextLimit}
                onChange={(event) => editSection(item.id, { text: event.currentTarget.value })} />
            </label>
            {item.kind === "gallery" && <GalleryEditor pieceIds={item.pieceIds} catalog={catalog}
              update={(pieceIds) => editSection(item.id, { pieceIds })} />}
          </div>}
        </li>;
      })}
    </ol>
  </fieldset>;
}
