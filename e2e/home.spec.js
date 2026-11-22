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
    await expect(page.getByRole("link", { name: "Mandar mensagem" }))
      .toHaveAttribute("href", "https://www.instagram.com/galarza.atelie/");
  }
});

test("mandar mensagem inicia navegacao para o perfil oficial sem passar por ig.me", async ({ page }) => {
  await page.goto("/?pagina=encomendas");
  const outbound = page.waitForRequest((request) => request.isNavigationRequest() &&
    /^(ig\.me|www\.instagram\.com)$/.test(new URL(request.url()).hostname));
  await page.getByRole("link", { name: "Mandar mensagem" }).click({ noWaitAfter: true });
  expect((await outbound).url()).toBe("https://www.instagram.com/galarza.atelie/");
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

test("a peça escolhida segue para a encomenda e a galeria aceita zoom e navegação", async ({ page }) => {
  await page.goto("/?peca=copo-estrelas");
  await page.getByRole("button", { name: /ampliar foto/i }).first().click();
  const viewer = page.getByRole("dialog", { name: "Foto ampliada" });
  await viewer.getByRole("button", { name: "Aproximar" }).click();
  await expect(viewer.getByRole("img")).toHaveAttribute("style", /scale\(1\.5\)/);
  await viewer.getByRole("button", { name: "Afastar" }).click();
  await expect(viewer.getByRole("button", { name: "Afastar" })).toBeDisabled();
  await viewer.getByRole("button", { name: "Próxima" }).click();
  await expect(viewer.getByRole("img")).toHaveAttribute("src", /copo-estrelas-lateral/);
  await page.keyboard.press("Escape");
  await page.getByRole("link", { name: "Encomendar com esta referência" }).click();
  await expect(page).toHaveURL(/referencia=copo-estrelas/);
  await expect(page.getByText("Copo estrelas")).toBeVisible();
  await expect(page.getByRole("button", { name: "Copiar link da peça" })).toBeVisible();
});

test("o ponteiro explora os ângulos reais, aproxima e restaura a primeira foto", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop");
  await page.goto("/?peca=copo-estrelas");
  const preview = page.locator(".storefront-inspection");
  await preview.scrollIntoViewIfNeeded();
  await expect.poll(() => preview.locator("img").evaluateAll((images) =>
    images.every((image) => image.complete && image.naturalWidth > 0))).toBe(true);
  const box = await preview.boundingBox();
  await page.mouse.move(box.x + box.width * 0.95, box.y + box.height * 0.45);
  await expect(preview).toHaveAttribute("data-angle", "2");
  await page.mouse.move(box.x + box.width * 0.42, box.y + box.height * 0.55);
  const active = preview.locator('img[data-active="true"]');
  await expect(active).toHaveCSS("transform", "matrix(1.55, 0, 0, 1.55, 0, 0)");
  const origin = await active.evaluate((image) => image.style.transformOrigin);
  await page.mouse.move(box.x + box.width * 0.64, box.y + box.height * 0.45);
  expect(await active.evaluate((image) => image.style.transformOrigin)).not.toBe(origin);
  await page.mouse.move(box.x - 5, box.y);
  await expect(preview).toHaveAttribute("data-angle", "0");
  await expect(preview.locator('img[data-active="true"]')).toHaveCSS("transform", "none");
});

test("peça com uma foto oferece aproximação e respeita movimento reduzido", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?peca=canecas-florais");
  const preview = page.locator(".storefront-inspection");
  await preview.hover();
  await expect(preview.locator("img")).toHaveCount(1);
  await expect(preview.locator("img")).toHaveCSS("transition-duration", "0s");
  await expect(preview).toHaveAttribute("data-zoomed", "true");
  await preview.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(preview).toBeFocused();
});

test("pinça e arraste funcionam no visualizador sem capturar o toque da página", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith("mobile"));
  await page.goto("/?peca=copo-estrelas");
  const preview = page.locator(".storefront-inspection");
  await expect(preview).toHaveCSS("touch-action", "auto");
  await preview.click();
  const stage = page.locator(".storefront-photo-stage");
  const box = await stage.boundingBox();
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  const session = await page.context().newCDPSession(page);
  const touch = (type, touchPoints) => session.send("Input.dispatchTouchEvent", { type, touchPoints });
  const points = (distance) => [{ x: x - distance, y, id: 1 }, { x: x + distance, y, id: 2 }];
  await touch("touchStart", points(22));
  await touch("touchMove", points(62));
  await touch("touchEnd", []);
  const image = stage.locator("img");
  await expect.poll(async () => Number((await image.getAttribute("style")).match(/scale\(([^)]+)/)[1])).toBeGreaterThan(1.5);
  await touch("touchStart", [{ x, y, id: 1 }]);
  await touch("touchMove", [{ x: x + 45, y: y + 32, id: 1 }]);
  await touch("touchEnd", []);
  await expect(image).not.toHaveAttribute("style", /translate\(0px, 0px\)/);
});
