import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { InstagramSection } from "./InstagramSection.jsx";

it("renders a curated, resilient Instagram section", () => {
  render(<InstagramSection />);
  expect(screen.getByRole("heading", { name: /coisas que estão.*acontecendo/i })).toBeInTheDocument();
  const cards = screen.getAllByRole("link", { name: /abrir instagram/i });
  expect(cards).toHaveLength(4);
  cards.forEach((card) => expect(card).toHaveAttribute("rel", "noopener noreferrer"));
});
