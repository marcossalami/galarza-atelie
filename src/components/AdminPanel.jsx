import "./catalog-admin.css";

export const adminSections = [
  { id: "capa", title: "Foto de capa", description: "Troque a primeira foto que aparece na loja.", icon: "▧" },
  { id: "secoes", title: "Seções da página", description: "Escolha o que aparece e em que ordem.", icon: "☷" },
  { id: "destaques", title: "Peças em destaque", description: "Escolha quais peças aparecem primeiro.", icon: "✦" },
];

export function AdminHeader({ back = true }) {
  return <header className="admin-top">
    <a href="/gestao" className="admin-brand"><span aria-hidden="true">✦</span> Galarza Ateliê</a>
    <nav aria-label="Painel">
      {back && <a href="/gestao">Painel</a>}
      <a href="/" target="_blank" rel="noreferrer">Ver loja ↗</a>
      <form action="/gestao/sair" method="post"><button type="submit">Sair</button></form>
    </nav>
  </header>;
}

export function AdminPanel() {
  return <div className="admin-shell">
    <AdminHeader back={false} />
    <main className="admin-page">
      <div className="admin-welcome">
        <div>
          <h1>O que você quer editar?</h1>
          <p>Escolha uma parte da loja para começar.</p>
        </div>
        <img src="/galarza-capa-acervo.jpg" alt="" />
      </div>
      <div className="admin-cards">
        <a className="admin-card admin-card-catalog" href="/gestao?editar=pecas">
          <span className="admin-card-icon" aria-hidden="true">◈</span>
          <h2>Minhas peças</h2>
          <p>Adicione peças, mude fotos e preços ou marque uma venda.</p>
          <span className="admin-card-arrow" aria-hidden="true">↗</span>
        </a>
        {adminSections.map(({ id, title, description, icon }) => <a className="admin-card" key={id} href={`/gestao?editar=inicio&parte=${id}`}>
          <span className="admin-card-icon" aria-hidden="true">{icon}</span>
          <h2>{title}</h2>
          <p>{description}</p>
          <span className="admin-card-arrow" aria-hidden="true">↗</span>
        </a>)}
      </div>
      <a className="admin-review-link" href="/gestao?editar=inicio&parte=previa">Conferir a página inicial e publicar <span aria-hidden="true">→</span></a>
    </main>
  </div>;
}
