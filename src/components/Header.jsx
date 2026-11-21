import { navigation } from "../content/siteContent.js";

export function Header() {
  return <nav className="topbar" aria-label="Navegação principal">
    <a className="brand" href="/" aria-label="Galarza Ateliê, início"><img src="/galarza-estrela.jpeg" alt="" /><span>Galarza<br />Ateliê</span></a>
    <div className="navlinks">{navigation.map((item) => <a key={item.href} href={item.href}>{item.label}</a>)}</div>
    <a className="nav-cta" href="#lista">Lista de espera</a>
  </nav>;
}
