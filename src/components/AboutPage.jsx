import { Header } from "./Header.jsx";
import { Footer } from "./Footer.jsx";

export function AboutPage() {
  return <main>
    <div className="about-page">
      <Header />
      <article className="about-content">
        <p className="eyebrow">o ateliê</p>
        <h1>A história será contada<br />no seu <i>próprio tempo.</i></h1>
        <p className="about-lead">Este é o espaço reservado para a narrativa da criadora: os começos, as referências, a relação com a cerâmica e o caminho que trouxe o ateliê até Campo Grande.</p>
        <section aria-labelledby="about-structure-title"><h2 id="about-structure-title">Estrutura editorial</h2><ol className="about-outline"><li><strong>Retrato e apresentação</strong><span>Foto e texto aprovados pela criadora.</span></li><li><strong>Origem do ateliê</strong><span>O que ela quiser compartilhar sobre o início do fazer.</span></li><li><strong>Matéria e processo</strong><span>Imagens do trabalho, do forno e das escolhas de material.</span></li><li><strong>Hoje e adiante</strong><span>O que orienta as peças e os próximos passos do ateliê.</span></li></ol></section>
        <a className="text-link" href="/">Voltar para a vitrine</a>
      </article>
    </div>
    <Footer />
  </main>;
}
