import { usePageCopy } from "./PageCopyContext.js";
import { StorefrontHeader } from "./Storefront.jsx";

export function AboutPage() {
  const copy = usePageCopy("atelie");
  return <div className="storefront">
    <StorefrontHeader />
    <main className="storefront-wrap storefront-section storefront-about">
      <h1>{copy.title}</h1>
      {copy.text && <p className="storefront-page-copy">{copy.text}</p>}
      <a className="text-link" href="/">Voltar para a vitrine</a>
    </main>
  </div>;
}
