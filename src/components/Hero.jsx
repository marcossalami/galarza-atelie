export function Hero({ header }) {
  return <section className="hero" id="inicio">
    {header}
    <div className="hero-copy"><p className="eyebrow">Campo Grande, MS · Brasil</p><h1>Da matéria<br />ao <i>calor.</i></h1><p className="hero-text">Cerâmicas autorais, feitas à mão para acompanhar os rituais simples de todos os dias.</p><a className="button button-light" href="#lista">Acompanhar lançamentos</a></div>
    <p className="hero-caption">Galarza Ateliê<br />cerâmicas quentes</p>
  </section>;
}
