import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import App from "./App.jsx";

describe("Home page", () => {
  beforeEach(() => render(<App />));

  it("renders the primary navigation and landmark sections", () => {
    expect(screen.getByRole("navigation", { name: "Navegação principal" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /da matéria/i })).toBeInTheDocument();
    expect(document.querySelectorAll("section")).toHaveLength(8);
  });

  it("renders all current portfolio images with meaningful alt text", () => {
    const images = screen.getAllByRole("img", { name: /.+/ });
    expect(images).toHaveLength(11);
    expect(screen.getByAltText("Caneca preta com aranha e alça em forma de teia")).toBeInTheDocument();
  });

  it("keeps external Instagram links safe", () => {
    const links = screen.getAllByRole("link", { name: /instagram/i });
    expect(links.length).toBeGreaterThan(0);
    links.filter((link) => link.target === "_blank").forEach((link) => {
      expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
    });
  });

  it("sends commission requests to the official Instagram Direct", () => {
    expect(screen.getByRole("link", { name: /iniciar encomenda pelo direct/i })).toHaveAttribute("href", "https://ig.me/m/galarza.atelie");
  });
});
