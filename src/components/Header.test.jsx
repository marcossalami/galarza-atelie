import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { Header } from "./Header.jsx";

it("uses the shared navigation content", () => {
  render(<Header />);
  expect(screen.getByRole("link", { name: "Portfólio" })).toHaveAttribute("href", "#portfolio");
  expect(screen.getByRole("link", { name: "Processo" })).toHaveAttribute("href", "#processo");
  expect(screen.getByRole("link", { name: "Lista de espera" })).toHaveAttribute("href", "#lista");
  expect(screen.getByRole("link", { name: "Galarza Ateliê, início" }).querySelector("img")).toHaveAttribute("src", "/galarza-estrela.jpeg");
  expect(screen.queryByText("#7C999C")).not.toBeInTheDocument();
});
