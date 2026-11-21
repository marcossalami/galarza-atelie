import { Footer } from "./components/Footer.jsx";
import { Header } from "./components/Header.jsx";
import { Hero } from "./components/Hero.jsx";
import { Intro } from "./components/Intro.jsx";
import { Portfolio } from "./components/Portfolio.jsx";
import { Process } from "./components/Process.jsx";
import { Archive } from "./components/Archive.jsx";
import { Commissions } from "./components/Commissions.jsx";
import { Waitlist } from "./components/Waitlist.jsx";
import { AboutPage } from "./components/AboutPage.jsx";

export default function App() {
  if (new URLSearchParams(window.location.search).get("pagina") === "atelie") {
    return <AboutPage />;
  }

  return (
    <main>
      <Hero header={<Header />} />
      <Intro />
      <Portfolio />
      <Process />
      <Archive />
      <Commissions />
      <Waitlist />
      <Footer />
    </main>
  );
}
