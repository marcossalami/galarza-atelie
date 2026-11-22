import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { CatalogPage } from "./CatalogPage.jsx";

it("filters the catalog without promising inventory", () => {
  render(<CatalogPage />);
  expect(screen.getByRole("heading", { name: "Caneca corrente rosa" })).toBeInTheDocument();
  expect(screen.getAllByText("Disponibilidade sob consulta").length).toBeGreaterThan(0);
  fireEvent.click(screen.getByRole("tab", { name: "Bowls" }));
  expect(screen.getByText(/ainda não há peças fotografadas neste formato/i)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("tab", { name: "Casa" }));
  expect(screen.getByRole("heading", { name: "Vaso azul" })).toBeInTheDocument();
});
