import { expect, test, type Page } from "playwright/test";

type Box = { x: number; y: number; width: number; height: number };

function boxesOverlap(a: Box, b: Box) {
  return !(
    a.x + a.width <= b.x ||
    b.x + b.width <= a.x ||
    a.y + a.height <= b.y ||
    b.y + b.height <= a.y
  );
}

async function boxFor(page: Page, selector: string) {
  const box = await page.locator(selector).boundingBox();
  expect(box, `${selector} should have a layout box`).not.toBeNull();
  return box as Box;
}

test("idle hero does not poll animation frames continuously", async ({ page }) => {
  await page.addInitScript(() => {
    const nativeRequestAnimationFrame = window.requestAnimationFrame.bind(window);
    let requestCount = 0;

    window.requestAnimationFrame = (callback) => {
      requestCount += 1;
      return nativeRequestAnimationFrame(callback);
    };

    Object.defineProperty(window, "__aetherRafCount", {
      get: () => requestCount,
    });
  });

  await page.goto("/");
  await page.waitForTimeout(250);
  const before = await page.evaluate(
    () => (window as Window & { __aetherRafCount: number }).__aetherRafCount,
  );
  await page.waitForTimeout(500);
  const after = await page.evaluate(
    () => (window as Window & { __aetherRafCount: number }).__aetherRafCount,
  );

  expect(after - before).toBeLessThanOrEqual(2);
});

test("recording choices materially change the scene and telemetry", async ({ page }) => {
  await page.goto("/");
  const hero = page.locator(".hero");
  const initialTransform = await hero.evaluate((element) =>
    getComputedStyle(element).getPropertyValue("--scene-transform"),
  );

  await page.locator(".recording-previews button").nth(1).click();

  await expect(hero).toHaveAttribute("data-scene", "mercury-gate");
  await expect(page.locator(".control-row").filter({ hasText: "Focus" })).toContainText(
    "6.4m",
  );
  await expect(page.locator(".control-row").filter({ hasText: "Vector" })).toContainText(
    "orbital",
  );
  const nextTransform = await hero.evaluate((element) =>
    getComputedStyle(element).getPropertyValue("--scene-transform"),
  );
  expect(nextTransform).not.toBe(initialTransform);
});

test("hero-local phases remain visible while Expose and Lock are active", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/");

  await page.evaluate(() => window.scrollTo(0, window.innerHeight * 0.4));
  await expect(page.locator(".phase-step.active span")).toHaveText("Expose");
  expect(Number(await page.locator(".phase-rail").evaluate((element) => getComputedStyle(element).opacity))).toBeGreaterThan(0.5);

  await page.evaluate(() => window.scrollTo(0, window.innerHeight * 0.72));
  await expect(page.locator(".phase-step.active span")).toHaveText("Lock");
  expect(Number(await page.locator(".phase-rail").evaluate((element) => getComputedStyle(element).opacity))).toBeGreaterThan(0.35);
});

test("reduced motion starts with the still image and paused media", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  await expect(page.getByRole("button", { name: "Play scene motion" })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await expect.poll(() => page.locator("video").evaluate((video) => video.paused)).toBe(true);

  const panel = page.locator(".sequence-panel").nth(1);
  await panel.hover();
  await panel.click();
  await expect
    .poll(() => panel.evaluate((element) => getComputedStyle(element).transform))
    .toBe("none");
  await expect
    .poll(() =>
      panel.evaluate((element) => getComputedStyle(element, "::before").transform),
    )
    .toBe("none");
});

test("media failure produces a truthful poster-only control state", async ({ page }) => {
  await page.route("**/aether-monolith-loop.*", (route) =>
    route.fulfill({ status: 404, body: "missing" }),
  );
  await page.goto("/");

  await expect(page.getByRole("button", { name: "Play scene motion" })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await expect(page.locator(".hero")).toHaveAttribute("data-media-state", "error");
});

test("a WebM decode failure falls back to the MP4 loop", async ({ page }) => {
  await page.route("**/aether-monolith-loop.webm", (route) =>
    route.fulfill({
      status: 200,
      contentType: "video/webm",
      body: "not a video",
    }),
  );
  await page.goto("/");

  await expect(page.locator(".hero")).toHaveAttribute("data-media-state", "playing");
  await expect
    .poll(() => page.locator("video").evaluate((video) => video.currentSrc))
    .toContain("aether-monolith-loop.mp4");
});

test("recording tabs implement keyboard selection and panel relationships", async ({ page }) => {
  await page.goto("/#recordings");
  const tabs = page.getByRole("tab");
  const panel = page.getByRole("tabpanel");

  await expect(tabs.nth(0)).toHaveAttribute("tabindex", "0");
  await expect(tabs.nth(1)).toHaveAttribute("tabindex", "-1");
  await expect(tabs.nth(0)).toHaveAttribute("aria-controls", "recording-panel");
  await expect(panel).toHaveAttribute("aria-labelledby", "recording-tab-0");

  await tabs.nth(0).focus();
  await page.keyboard.press("ArrowRight");
  await expect(tabs.nth(1)).toBeFocused();
  await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
  await expect(panel).toHaveAttribute("aria-labelledby", "recording-tab-1");

  await page.keyboard.press("End");
  await expect(tabs.nth(2)).toBeFocused();
  await page.keyboard.press("Home");
  await expect(tabs.nth(0)).toBeFocused();
});

test("Enter Field transfers focus and faded hero controls leave the accessibility tree", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Enter Field" }).click();

  await expect(page.getByRole("heading", { name: "Scroll shifts the camera, not the page." })).toBeFocused();
  await expect(page.locator(".recording-previews")).toHaveAttribute("aria-hidden", "true");
  await expect(page.locator(".control-island")).toHaveAttribute("aria-hidden", "true");
});

test("desktop hero overlays do not collide", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/");

  const island = await boxFor(page, ".control-island");
  const previews = await boxFor(page, ".recording-previews");
  expect(boxesOverlap(island, previews)).toBe(false);
});

test("mobile keeps navigation, focal subject, and viewport width", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await expect(page.getByRole("link", { name: "Sequence" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Recordings" })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth === document.documentElement.clientWidth,
    ),
  ).toBe(true);
  await expect(page.locator(".hero-still")).toHaveCSS("object-position", /6[4-9]%/);
});

test("200 percent text resize uses flow layout without hero collisions", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.addStyleTag({ content: ":root { font-size: 200% !important; }" });

  const coordinates = await boxFor(page, ".coordinate-rail");
  const copy = await boxFor(page, ".hero-copy");
  const island = await boxFor(page, ".control-island");
  const hero = await boxFor(page, ".hero");
  const nav = await boxFor(page, ".nav-links");

  expect(boxesOverlap(coordinates, copy)).toBe(false);
  expect(boxesOverlap(copy, island)).toBe(false);
  expect(island.y + island.height).toBeLessThanOrEqual(hero.y + hero.height + 1);
  expect(copy.x + copy.width).toBeLessThanOrEqual(hero.x + hero.width + 1);
  expect(nav.x + nav.width).toBeLessThanOrEqual(hero.x + hero.width + 1);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth === document.documentElement.clientWidth,
    ),
  ).toBe(true);
});

test("favicon resolves without a console-visible 404", async ({ page, request }) => {
  const response = await request.get("/favicon.svg");
  expect(response.ok()).toBe(true);
  expect(response.headers()["content-type"]).toContain("image/svg+xml");

  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/");
  expect(errors).toEqual([]);
});
