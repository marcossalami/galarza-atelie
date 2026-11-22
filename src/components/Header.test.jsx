import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { Header } from "./Header.jsx";

it("uses the shared navigation content", () => {
  render(<Header />);
  expect(screen.getByRole("link", { name: "Portfólio" })).toHaveAttribute("href", "/#portfolio");
  expect(screen.getByRole("link", { name: "Catálogo" })).toHaveAttribute("href", "/?pagina=catalogo");
  expect(screen.getByRole("link", { name: "Encomendar" })).toHaveAttribute("href", "/?pagina=encomendas");
  expect(screen.getByRole("link", { name: "Galarza Ateliê, início" }).querySelector("img")).toHaveAttribute("src", "/galarza-estrela.jpeg");
  expect(screen.queryByText("#7C999C")).not.toBeInTheDocument();
});
