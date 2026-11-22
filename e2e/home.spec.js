import { expect, test } from "@playwright/test";

test("a vitrine se ajusta à tela e abre as referências pelo menu", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Galarza Ateliê" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Instagram" })).toBeVisible();
  await page.locator("summary").click();
  await page.getByRole("navigation", { name: "Navegação principal" }).getByRole("link", { name: "Referências" }).click();
  await expect(page).toHaveURL(/pagina=referencias/);
  await expect(page.getByRole("heading", { name: "Copos" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
});

test("o catálogo anterior ainda abre e filtra as peças", async ({ page }) => {
  await page.goto("/?pagina=catalogo");
  await page.getByRole("tab", { name: "Casa" }).click();
  await expect(page.getByRole("heading", { name: "Vaso azul" })).toBeVisible();
});
