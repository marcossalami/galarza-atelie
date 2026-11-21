import { Footer } from "./components/Footer.jsx";
import { Header } from "./components/Header.jsx";
import { Hero } from "./components/Hero.jsx";
import { HomeSections } from "./components/HomeSections.jsx";

export default function App() {
  return (
    <main>
      <Hero header={<Header />} />
      <HomeSections />
      <Footer />
    </main>
  );
}
