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

test("encomendas abrem uma página com o perfil oficial", async ({ page }) => {
  for (const url of ["/", "/?pagina=referencias", "/?pagina=catalogo"]) {
    await page.goto(url);
    await page.getByRole("link", { name: "Encomendar", exact: true }).first().click();
    await expect(page).toHaveURL(/pagina=encomendas/);
    await expect(page.getByRole("link", { name: "Abrir perfil no Instagram" }))
      .toHaveAttribute("href", "https://www.instagram.com/galarza.atelie/");
  }
});

test("uma referência sem preço tem detalhe e foto ampliável", async ({ page }) => {
  await page.goto("/?pagina=referencias");
  await page.getByRole("link", { name: /Flores à mesa/ }).click();
  await expect(page.getByRole("heading", { name: "Flores à mesa" })).toBeVisible();
  await expect(page.getByText("Sob consulta", { exact: true })).toHaveCount(2);
  await page.getByRole("button", { name: /ampliar foto/i }).click();
  const lightbox = page.getByRole("dialog", { name: "Foto ampliada" });
  await expect(lightbox.getByRole("img")).toBeVisible();
  await lightbox.getByRole("button", { name: "Fechar foto" }).click();
  await expect(lightbox).not.toBeVisible();
});
