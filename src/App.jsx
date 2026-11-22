import { useEffect, useState } from "react";
import { AboutPage } from "./components/AboutPage.jsx";
import { CatalogPage } from "./components/CatalogPage.jsx";
import { getCatalogItem } from "./content/catalog.js";
import { Storefront, ReferencesPage } from "./components/Storefront.jsx";
import { CommissionPage } from "./components/CommissionPage.jsx";
import { CatalogAdmin, PublishedPiece } from "./components/CatalogAdmin.jsx";
import { HomeAdmin } from "./components/HomeAdmin.jsx";
import { AdminPanel } from "./components/AdminPanel.jsx";
import { PageCopyContext } from "./components/PageCopyContext.js";
import { requestJson } from "./components/adminRequests.js";

function PageScreen({ page, params, preview = false }) {
  if (page === "atelie") return <AboutPage />;
  if (page === "catalogo") return <CatalogPage />;
  if (page === "referencias") return <ReferencesPage />;
  if (page === "encomendas") return <CommissionPage piece={getCatalogItem(params.get("referencia"))}
    publishedId={params.get("referenciaPublicada")} buying={params.get("comprar") === "1"} />;
  return <Storefront preview={preview} />;
}

function PageDraftPreview({ page, params }) {
  const [pages, setPages] = useState(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    const request = new AbortController();
    requestJson("/api/gestao/inicio", { signal: request.signal })
      .then(({ draft }) => setPages(draft.pages ?? {}))
      .catch(() => { if (!request.signal.aborted) setError(true); });
    return () => request.abort();
  }, []);
  if (pages === null) return <p role="status">{error ? "Prévia indisponível. Entre novamente na gestão." : "Carregando prévia…"}</p>;
  return <PageCopyContext.Provider value={pages}>
    <div onClick={(event) => {
      const href = event.target.closest("a")?.getAttribute("href");
      if (href && !href.startsWith("#")) event.preventDefault();
    }}>
      <PageScreen page={page} params={params} preview />
    </div>
  </PageCopyContext.Provider>;
}

export default function App() {
  const params = new URLSearchParams(window.location.search);
  const page = params.get("pagina");
  if (/^\/gestao\/?$/.test(window.location.pathname)) {
    if (params.get("ver") === "inicio") return page && page !== "inicio"
      ? <PageDraftPreview page={page} params={params} /> : <Storefront preview />;
    if (params.get("editar") === "inicio") return <HomeAdmin initialSection={params.get("parte")} />;
    if (params.get("editar") === "pecas") return <CatalogAdmin />;
    return <AdminPanel />;
  }
  if (params.has("publicada")) return <PublishedPiece id={params.get("publicada")} />;
  const piece = getCatalogItem(params.get("peca"));

  if (piece) {
    return <PublishedPiece id={params.get("peca")} fallback={piece} />;
  }

  return <PageScreen page={page} params={params} />;
}
