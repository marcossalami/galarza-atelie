import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import App from "./App.jsx";

describe("Vitrine pública", () => {
  afterEach(() => window.history.replaceState(null, "", "/"));

  it("oferece o perfil oficial, encomendas e referências quando não há estoque confirmado", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: "Galarza Ateliê" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Instagram" })).toHaveAttribute("href", "https://www.instagram.com/galarza.atelie/");
    expect(screen.getAllByRole("link", { name: "Encomendar" })).toHaveLength(2);
    expect(screen.getByText("Sem peças disponíveis no momento.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver referências" })).toHaveAttribute("href", "/?pagina=referencias");
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
    expect(screen.getByRole("link", { name: "Consultar pelo Direct" })).toHaveAttribute("href", "https://ig.me/m/galarza.atelie");
    fireEvent.click(screen.getByRole("button", { name: "Copiar mensagem" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Copo estrelas");
  });
});
