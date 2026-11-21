import { navigation } from "../content/siteContent.js";

export function Header() {
  return <nav className="topbar" aria-label="Navegação principal">
    <a className="brand" href="#inicio" aria-label="Galarza Ateliê, início"><img src="/galarza-logo.jpeg" alt="Galarza Ateliê" /></a>
    <div className="navlinks">{navigation.map((item) => <a key={item.href} href={item.href}>{item.label}</a>)}</div>
    <a className="nav-cta" href="#lista">Lista de espera</a>
  </nav>;
}
