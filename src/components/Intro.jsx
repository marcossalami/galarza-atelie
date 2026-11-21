import { ExternalLink } from "./ExternalLink.jsx";

export function Intro() {
  return <section className="intro" id="atelie"><p className="eyebrow">feito sem pressa</p><div className="intro-grid"><h2>Peças únicas,<br />feitas para<br /><i>serem sentidas.</i></h2><div className="intro-copy"><p>Cada peça nasce do encontro entre matéria, tempo e fogo. As pequenas marcas não são defeitos: são o registro de um fazer que não se repete.</p><p>A história do ateliê será contada aqui, nas palavras da própria artista.</p><div className="intro-actions"><a className="text-link" href="?pagina=atelie">O espaço do ateliê</a><ExternalLink>Acompanhar no Instagram</ExternalLink></div></div></div></section>;
}
