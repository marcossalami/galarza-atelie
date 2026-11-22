import { AboutPage } from "./components/AboutPage.jsx";
import { CatalogPage } from "./components/CatalogPage.jsx";
import { PieceDetailPage } from "./components/PieceDetailPage.jsx";
import { getCatalogItem } from "./content/catalog.js";
import { Storefront, ReferencesPage } from "./components/Storefront.jsx";

export default function App() {
  const params = new URLSearchParams(window.location.search);
  const piece = getCatalogItem(params.get("peca"));

  if (piece) {
    return <PieceDetailPage piece={piece} />;
  }

  if (params.get("pagina") === "atelie") {
    return <AboutPage />;
  }

  if (params.get("pagina") === "catalogo") {
    return <CatalogPage />;
  }

  if (params.get("pagina") === "referencias") return <ReferencesPage />;
  return <Storefront />;
}
