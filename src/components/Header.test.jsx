import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { Header } from "./Header.jsx";

it("uses the shared navigation content", () => {
  render(<Header />);
  expect(screen.getByRole("link", { name: "Portfólio" })).toHaveAttribute("href", "#portfolio");
  expect(screen.getByRole("link", { name: "Lista de espera" })).toHaveAttribute("href", "#lista");
});
