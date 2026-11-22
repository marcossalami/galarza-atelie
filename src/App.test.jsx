import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App.jsx";
import * as catalog from "./content/catalog.js";

describe("Vitrine pública", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    window.history.replaceState(null, "", "/");
  });

  it("oferece o perfil oficial, encomendas e referências quando não há estoque confirmado", () => {
    vi.spyOn(catalog, "getAvailablePieces").mockReturnValue([]);
    render(<App />);
    expect(screen.getByRole("heading", { name: "Galarza Ateliê" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Instagram" })).toHaveAttribute("href", "https://www.instagram.com/galarza.atelie/");
    expect(screen.getAllByRole("link", { name: "Encomendar" })).toHaveLength(2);
    expect(screen.getByText("Sem peças disponíveis no momento.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver referências" })).toHaveAttribute("href", "/?pagina=referencias");
  });

  it("liga uma peça disponível ao detalhe com preço em reais", () => {
    vi.spyOn(catalog, "getAvailablePieces").mockReturnValue([
      { slug: "copo-estrelas", name: "Copo estrelas", image: "copo-estrelas.jpeg", alt: "", priceInCents: 12500 },
    ]);
    render(<App />);
    expect(screen.getByRole("link", { name: /copo estrelas.*125,00/i })).toHaveAttribute("href", "/?peca=copo-estrelas");
  });

  it("preserva o link da peça vendida e oferece acesso às referências", () => {
    const piece = catalog.getCatalogItem("copo-estrelas");
    vi.spyOn(catalog, "getCatalogItem").mockReturnValue({ ...piece, status: "sold", priceInCents: 12500 });
    window.history.replaceState(null, "", "/?peca=copo-estrelas");
    render(<App />);
    expect(screen.getByText("Vendida")).toBeInTheDocument();
    expect(screen.queryByText(/125,00/)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ver referências/i })).toBeInTheDocument();
  });

  it("mostra trabalhos feitos por formato sem preço", () => {
    window.history.replaceState(null, "", "/?pagina=referencias");
    render(<App />);
    expect(screen.getByRole("heading", { name: "Copos" })).toBeInTheDocument();
    expect(screen.getByAltText("Caneca preta com aranha e alça em forma de teia")).toBeInTheDocument();
    expect(screen.queryByText(/R\$/)).not.toBeInTheDocument();
  });

  it("oferece o Direct e uma mensagem manual quando copiar não é possível", async () => {
    window.history.replaceState(null, "", "/?peca=copo-estrelas");
    render(<App />);
    expect(screen.getByRole("link", { name: "Abrir perfil no Instagram" })).toHaveAttribute("href", "https://www.instagram.com/galarza.atelie/");
    fireEvent.click(screen.getByRole("button", { name: "Copiar mensagem" }));
    expect(await screen.findByText(/copie esta mensagem/i)).toHaveTextContent("Copo estrelas");
  });
});
