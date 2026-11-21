import { expect, test } from "@playwright/test";

test("desktop layout keeps the full navigation and four-column portfolio", async ({ page }, testInfo) => {
  testInfo.skip(testInfo.project.name !== "desktop", "Desktop-only layout assertion");
  await page.goto("/");
  await expect(page.getByRole("navigation", { name: "Navegação principal" })).toBeVisible();
  await expect(page.locator(".navlinks")).toBeVisible();
  expect(await page.locator(".portfolio-grid").evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(" ").length)).toBe(4);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
});

test("mobile layout does not overflow and stacks portfolio cards", async ({ page }, testInfo) => {
  testInfo.skip(testInfo.project.name !== "mobile", "Mobile-only layout assertion");
  await page.goto("/");
  await expect(page.locator(".navlinks")).toBeHidden();
  const layout = await page.locator(".portfolio-grid").evaluate((grid) => ({
    viewport: window.innerWidth,
    columns: getComputedStyle(grid).gridTemplateColumns.split(" ").length,
    cards: [...grid.children].map((card) => card.getBoundingClientRect().toJSON()),
  }));
  expect(layout.columns).toBe(1);
  expect(layout.cards.every((box) => box.left >= 0 && box.right <= layout.viewport)).toBeTruthy();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
});
