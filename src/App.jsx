import { Footer } from "./components/Footer.jsx";
import { Header } from "./components/Header.jsx";
import { Hero } from "./components/Hero.jsx";
import { Intro } from "./components/Intro.jsx";
import { Portfolio } from "./components/Portfolio.jsx";
import { InstagramSection } from "./components/InstagramSection.jsx";
import { Process } from "./components/Process.jsx";
import { Archive } from "./components/Archive.jsx";
import { Commissions } from "./components/Commissions.jsx";
import { Waitlist } from "./components/Waitlist.jsx";
import { AboutPage } from "./components/AboutPage.jsx";
import { CatalogPage } from "./components/CatalogPage.jsx";
import { PieceDetailPage } from "./components/PieceDetailPage.jsx";
import { getCatalogItem } from "./content/catalog.js";

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

  return (
    <main>
      <Hero header={<Header />} />
      <Intro />
      <Portfolio />
      <InstagramSection />
      <Process />
      <Archive />
      <Commissions />
      <Waitlist />
      <Footer />
    </main>
  );
}
