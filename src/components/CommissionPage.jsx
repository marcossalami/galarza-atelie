import { useState } from "react";
import { instagramUrl, instagramDirectUrl } from "../content/siteContent.js";
import { StorefrontHeader } from "./Storefront.jsx";

export function ContactActions({ message }) {
  const [copied, setCopied] = useState(null);

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return <>
    <div className="storefront-actions">
      <a className="storefront-button" href={instagramUrl}>Abrir perfil no Instagram</a>
      <a className="text-link" href={instagramDirectUrl}>Tentar abrir o Direct</a>
      <button className="storefront-instagram" type="button" onClick={copyMessage}>Copiar mensagem</button>
    </div>
    <p className="storefront-detail-message" role="status">
      {copied === true && "Mensagem copiada."}
      {copied === false && <>Copie esta mensagem: {message}</>}
    </p>
  </>;
}

export function CommissionPage() {
  return <div className="storefront">
    <StorefrontHeader />
    <main className="storefront-wrap storefront-section storefront-contact">
      <h1>Encomendas</h1>
      <p>Abra o perfil <strong>@galarza.atelie</strong> e toque em <strong>Mensagem</strong> para contar sua ideia. Se tiver uma peça de referência, envie a foto ou o link.</p>
      <ContactActions message="Oi! Gostaria de conversar sobre uma encomenda de cerâmica." />
    </main>
  </div>;
}
