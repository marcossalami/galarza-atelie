import { AboutPage } from "./components/AboutPage.jsx";
import { CatalogPage } from "./components/CatalogPage.jsx";
import { getCatalogItem } from "./content/catalog.js";
import { Storefront, ReferencesPage } from "./components/Storefront.jsx";
import { CommissionPage } from "./components/CommissionPage.jsx";
import { CatalogAdmin, PublishedPiece } from "./components/CatalogAdmin.jsx";
import { HomeAdmin } from "./components/HomeAdmin.jsx";
import { AdminPanel } from "./components/AdminPanel.jsx";

export default function App() {
  const params = new URLSearchParams(window.location.search);
  if (/^\/gestao\/?$/.test(window.location.pathname)) {
    if (params.get("ver") === "inicio") return <Storefront preview />;
    if (params.get("editar") === "inicio") return <HomeAdmin initialSection={params.get("parte")} />;
    if (params.get("editar") === "pecas") return <CatalogAdmin />;
    return <AdminPanel />;
  }
  if (params.has("publicada")) return <PublishedPiece id={params.get("publicada")} />;
  const piece = getCatalogItem(params.get("peca"));

  if (piece) {
    return <PublishedPiece id={params.get("peca")} fallback={piece} />;
  }

  if (params.get("pagina") === "atelie") {
    return <AboutPage />;
  }

  if (params.get("pagina") === "catalogo") {
    return <CatalogPage />;
  }

  if (params.get("pagina") === "referencias") return <ReferencesPage />;
  if (params.get("pagina") === "encomendas") {
    return <CommissionPage piece={getCatalogItem(params.get("referencia"))} publishedId={params.get("referenciaPublicada")} />;
  }
  return <Storefront />;
}
