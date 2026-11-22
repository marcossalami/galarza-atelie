import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App.jsx";
import * as catalog from "./content/catalog.js";

describe("Vitrine pública", () => {
  beforeEach(() => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (path) =>
      path === "/api/pecas" ? Response.json([]) : new Response(null, { status: 404 }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.history.replaceState(null, "", "/");
  });

  it("oferece o perfil oficial, encomendas e referências quando não há estoque confirmado", async () => {
    vi.spyOn(catalog, "getAvailablePieces").mockReturnValue([]);
    render(<App />);
    expect(screen.getByRole("heading", { name: "Galarza Ateliê" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Mensagem no Instagram" })).toHaveAttribute("href", "https://www.instagram.com/galarza.atelie/");
    expect(await screen.findByText("Sem peças disponíveis no momento.")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Encomendar" })).toHaveLength(2);
    expect(screen.getByRole("link", { name: "Ver referências" })).toHaveAttribute("href", "/?pagina=referencias");
  });

  it("liga uma peça disponível ao detalhe com preço em reais", async () => {
    vi.spyOn(catalog, "getAvailablePieces").mockReturnValue([
      { slug: "copo-estrelas", name: "Copo estrelas", image: "copo-estrelas.jpeg", alt: "", priceInCents: 12500 },
    ]);
    render(<App />);
    expect(await screen.findByRole("link", { name: /copo estrelas.*125,00/i })).toHaveAttribute("href", "/?peca=copo-estrelas");
  });

  it("preserva o link da peça vendida e oferece acesso às referências", async () => {
    const piece = catalog.getCatalogItem("copo-estrelas");
    vi.spyOn(catalog, "getCatalogItem").mockReturnValue({ ...piece, status: "sold", priceInCents: 12500 });
    window.history.replaceState(null, "", "/?peca=copo-estrelas");
    render(<App />);
    expect(await screen.findByText("Vendida")).toBeInTheDocument();
    expect(screen.queryByText(/125,00/)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ver referências/i })).toBeInTheDocument();
  });

  it("mostra trabalhos feitos por formato sem preço", async () => {
    window.history.replaceState(null, "", "/?pagina=referencias");
    render(<App />);
    expect(await screen.findByRole("heading", { name: "Copos" })).toBeInTheDocument();
    expect(screen.getByAltText("Caneca preta com aranha e alça em forma de teia")).toBeInTheDocument();
    expect(screen.queryByText(/R\$/)).not.toBeInTheDocument();
  });

  it("mostra a peça associada e oferece o link quando copiar não é possível", async () => {
    window.history.replaceState(null, "", "/?pagina=encomendas&referencia=copo-estrelas");
    render(<App />);
    expect(screen.getByRole("link", { name: "Mandar mensagem" })).toHaveAttribute("href", "https://www.instagram.com/galarza.atelie/");
    expect(screen.getByText("Copo estrelas")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Copiar link da peça" }));
    expect(await screen.findByText(/^https?:.*peca=copo-estrelas$/)).toBeInTheDocument();
  });
});
