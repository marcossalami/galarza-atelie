import { portfolioItems } from "./siteContent.js";

export const catalogCategories = [
  { id: "xicaras", label: "Xícaras" },
  { id: "bowls", label: "Bowls" },
  { id: "travel-mugs", label: "Travel mugs" },
  { id: "casa", label: "Casa" },
];

export const catalogItems = [
  { slug: "caneca-corrente-rosa", name: "Caneca corrente rosa", category: "xicaras", image: "caneca-corrente-rosa.jpeg", alt: "Caneca rosa com alça de corrente", material: "Cerâmica artesanal", origin: "Campo Grande, MS", availability: "Disponibilidade sob consulta", details: "Medidas e capacidade são confirmadas pelo ateliê antes da encomenda." },
  { slug: "caneca-coracoes", name: "Caneca corações", category: "xicaras", image: "caneca-coracoes.jpeg", alt: "Caneca rosa com aplicações de corações", material: "Cerâmica artesanal", origin: "Campo Grande, MS", availability: "Disponibilidade sob consulta", details: "Medidas e capacidade são confirmadas pelo ateliê antes da encomenda." },
  { slug: "caneca-verde-musica", name: "Caneca verde", category: "xicaras", image: "caneca-verde-musica.jpeg", alt: "Caneca verde com desenhos musicais", material: "Cerâmica artesanal", origin: "Campo Grande, MS", availability: "Disponibilidade sob consulta", details: "Medidas e capacidade são confirmadas pelo ateliê antes da encomenda." },
  {
    slug: "copo-estrelas",
    name: "Copo estrelas",
    category: "travel-mugs",
    image: "copo-estrelas.jpeg",
    alt: "Copo com estrelas em relevo",
    photos: [
      { image: "copo-estrelas-lateral.jpeg", alt: "Vista lateral do copo com estrelas" },
      { image: "copo-estrelas-interior.jpeg", alt: "Interior do copo de cerâmica" },
    ],
    material: "Cerâmica artesanal",
    origin: "Campo Grande, MS",
    availability: "Disponibilidade sob consulta",
    details: "Medidas e capacidade são confirmadas pelo ateliê antes da encomenda.",
  },
  { slug: "vaso-azul", name: "Vaso azul", category: "casa", image: "vaso-azul.jpeg", alt: "Vaso azul texturizado", material: "Cerâmica artesanal", origin: "Campo Grande, MS", availability: "Disponibilidade sob consulta", details: "Medidas são confirmadas pelo ateliê antes da encomenda." },
  { slug: "porta-retrato-estrelas", name: "Porta-retrato estrelas", category: "casa", image: "porta-retrato.jpeg", alt: "Porta-retrato cerâmico com estrelas", material: "Cerâmica artesanal", origin: "Campo Grande, MS", availability: "Disponibilidade sob consulta", details: "Medidas são confirmadas pelo ateliê antes da encomenda." },
];

export function getCatalogItem(slug) {
  const registered = catalogItems.find((item) => item.slug === slug);
  if (registered) return registered;
  const reference = portfolioItems.find((item) => referenceSlug(item) === slug);
  return reference && { ...reference, name: reference.caption, availability: "Referência para encomendas" };
}

function referenceSlug(item) {
  return item.image.replace(/\.[^.]+$/, "");
}

export function pieceSlug(item) {
  return item.slug ?? catalogItems.find((piece) => piece.image === item.image)?.slug ?? referenceSlug(item);
}

export function pieceUrl(item) {
  return `/?peca=${encodeURIComponent(pieceSlug(item))}`;
}

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function piecePrice(piece) {
  return Number.isSafeInteger(piece.priceInCents) && piece.priceInCents > 0
    ? currency.format(piece.priceInCents / 100) : null;
}

export function getAvailablePieces() {
  return catalogItems.filter((piece) => piece.status === "available" && piecePrice(piece));
}

export function pieceAvailability(piece) {
  if (piece.status === "sold") return "Vendida";
  if (piece.status === "available" && piecePrice(piece)) return piecePrice(piece);
  return piece.availability ?? "Disponibilidade sob consulta";
}
