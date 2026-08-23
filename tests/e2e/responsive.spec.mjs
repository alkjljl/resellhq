import { expect, test } from "@playwright/test";
import {
  assertNoHorizontalOverflow,
  BrowserFixtures,
  loginViaUi,
} from "./support.mjs";

const viewports = [
  { width: 320, height: 568 },
  { width: 360, height: 800 },
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1280, height: 800 },
  { width: 1366, height: 768 },
  { width: 1440, height: 1024 },
  { width: 1536, height: 864 },
];

const publicRoutes = [
  { path: "/", name: "home" },
  { path: "/login", name: "sign in" },
  { path: "/signup", name: "sign up" },
  { path: "/forgot-password", name: "forgot password" },
  { path: "/reset-password", name: "reset password" },
  { path: "/privacy", name: "privacy" },
  { path: "/terms", name: "terms" },
  { path: "/auth/callback", name: "authentication callback error" },
  { path: "/responsive-route-does-not-exist", name: "not found" },
];

const applicationRoutes = [
  { path: "/dashboard", name: "dashboard" },
  { path: "/settings", name: "settings redirect" },
  { path: "/settings/profile", name: "profile settings" },
  { path: "/settings/business", name: "business settings" },
  { path: "/settings/team", name: "team settings" },
  { path: "/settings/preferences", name: "preference settings" },
  { path: "/settings/security", name: "security settings" },
];

function applyTheme(page, theme) {
  return Promise.all([
    page.addInitScript((selectedTheme) => {
      localStorage.setItem("theme", selectedTheme);
    }, theme),
    page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" }),
  ]);
}

async function settle(page) {
  await page.locator("body").waitFor({ state: "visible" });
  await page.evaluate(() => document.fonts.ready);
}

async function assertResponsivePage(page, viewport) {
  await settle(page);
  await assertNoHorizontalOverflow(page);

  const audit = await page.evaluate(({ width }) => {
    const visible = (element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return (
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        Number(style.opacity) !== 0 &&
        rect.width > 0 &&
        rect.height > 0
      );
    };
    const hasDirectText = (element) =>
      [...element.childNodes].some(
        (node) =>
          node.nodeType === Node.TEXT_NODE && Boolean(node.textContent?.trim()),
      );
    const insideBoundedHorizontalScroller = (element) => {
      for (let current = element.parentElement; current; current = current.parentElement) {
        const style = getComputedStyle(current);
        if (
          ["auto", "scroll"].includes(style.overflowX) &&
          current.scrollWidth > current.clientWidth
        ) {
          return true;
        }
      }
      return false;
    };

    const all = [...document.body.querySelectorAll("*")].filter(visible);
    const escaped = all
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return (
          (rect.left < -0.75 || rect.right > window.innerWidth + 0.75) &&
          !insideBoundedHorizontalScroller(element)
        );
      })
      .slice(0, 8)
      .map((element) => ({
        element: element.tagName.toLowerCase(),
        className: String(element.className).slice(0, 120),
        rect: element.getBoundingClientRect().toJSON(),
      }));

    const tooSmallText = all
      .filter(hasDirectText)
      .filter((element) => Number.parseFloat(getComputedStyle(element).fontSize) < 13)
      .slice(0, 8)
      .map((element) => ({
        text: element.textContent?.trim().slice(0, 80),
        size: getComputedStyle(element).fontSize,
      }));

    const interactive = all.filter((element) =>
      element.matches(
        "button, input:not([type=hidden]), select, textarea, a[href], [role=button], [role=menuitem], [role=tab]",
      ),
    );
    const smallInteractiveText = interactive
      .filter((element) => Number.parseFloat(getComputedStyle(element).fontSize) < 14)
      .slice(0, 8)
      .map((element) => ({
        label:
          element.getAttribute("aria-label") ??
          element.textContent?.trim().slice(0, 80) ??
          element.tagName,
        size: getComputedStyle(element).fontSize,
      }));

    const undersizedTargets = interactive
      .filter((element) => {
        const style = getComputedStyle(element);
        if (style.display === "inline") return false;
        if (element.matches("input[type=checkbox], input[type=radio]")) {
          const label = element.closest("label");
          if (label) element = label;
        }
        const rect = element.getBoundingClientRect();
        return rect.width < 44 || rect.height < 44;
      })
      .slice(0, 8)
      .map((element) => ({
        label:
          element.getAttribute("aria-label") ??
          element.textContent?.trim().slice(0, 80) ??
          element.tagName,
        rect: element.getBoundingClientRect().toJSON(),
      }));

    const smallMobileInputs =
      width <= 430
        ? interactive
            .filter((element) => element.matches("input, select, textarea"))
            .filter(
              (element) =>
                Number.parseFloat(getComputedStyle(element).fontSize) < 16,
            )
            .slice(0, 8)
            .map((element) => ({
              label: element.getAttribute("aria-label") ?? element.id,
              size: getComputedStyle(element).fontSize,
            }))
        : [];

    return {
      innerWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      escaped,
      tooSmallText,
      smallInteractiveText,
      undersizedTargets,
      smallMobileInputs,
    };
  }, viewport);

  expect(audit.innerWidth).toBe(viewport.width);
  expect(audit.documentWidth).toBeLessThanOrEqual(audit.innerWidth);
  expect(audit.escaped).toEqual([]);
  expect(audit.tooSmallText).toEqual([]);
  expect(audit.smallInteractiveText).toEqual([]);
  expect(audit.undersizedTargets).toEqual([]);
  expect(audit.smallMobileInputs).toEqual([]);
}

async function auditRouteAtEveryViewport(page, path) {
  await page.goto(path);
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await assertResponsivePage(page, viewport);
  }
}

test.describe.serial("responsive layout and typography acceptance", () => {
  let fixtures;
  let completedUser;
  let onboardingUser;

  test.beforeAll(async () => {
    fixtures = new BrowserFixtures();
    completedUser = await fixtures.createUser("responsive-complete", {
      completed: true,
    });
    onboardingUser = await fixtures.createUser("responsive-onboarding");
  });

  test.afterAll(async () => {
    await fixtures.cleanup();
  });

  for (const theme of ["light", "dark"]) {
    test(`${theme}: all public and authentication routes`, async ({ page }) => {
      await applyTheme(page, theme);
      for (const route of publicRoutes) {
        await test.step(route.name, async () => {
          await auditRouteAtEveryViewport(page, route.path);
          await expect(page.locator("html")).toHaveClass(new RegExp(theme));
        });
      }
    });

    test(`${theme}: onboarding at every required viewport`, async ({ page }) => {
      await applyTheme(page, theme);
      await loginViaUi(page, onboardingUser, /\/onboarding$/);
      await auditRouteAtEveryViewport(page, "/onboarding");
    });

    test(`${theme}: application and settings routes`, async ({ page }) => {
      await applyTheme(page, theme);
      await loginViaUi(page, completedUser, /\/dashboard$/);
      for (const route of applicationRoutes) {
        await test.step(route.name, async () => {
          await auditRouteAtEveryViewport(page, route.path);
        });
      }
    });
  }

  test("mobile drawer, bounded scrollers, and decoration clipping", async ({
    page,
  }) => {
    await page.setViewportSize(viewports[0]);
    await loginViaUi(page, completedUser, /\/dashboard$/);

    const openNavigation = page.getByRole("button", { name: "Open navigation" });
    await openNavigation.click();
    const drawer = page.getByRole("dialog", { name: "Workspace navigation" });
    await expect(drawer).toBeVisible();
    const drawerBounds = await drawer.boundingBox();
    expect(drawerBounds.x).toBeGreaterThanOrEqual(0);
    expect(drawerBounds.width).toBeLessThanOrEqual(viewports[0].width);
    expect(drawerBounds.height).toBeLessThanOrEqual(viewports[0].height);
    await page.keyboard.press("Escape");
    await expect(openNavigation).toBeFocused();

    const activityTrigger = page.getByRole("button", { name: /Activity,/ });
    await activityTrigger.click();
    const activity = page.getByRole("dialog", { name: "Activity" });
    await expect(activity).toBeVisible();
    const activityBounds = await activity.boundingBox();
    expect(activityBounds.x).toBeGreaterThanOrEqual(0);
    expect(activityBounds.y).toBeGreaterThanOrEqual(0);
    expect(activityBounds.x + activityBounds.width).toBeLessThanOrEqual(
      viewports[0].width,
    );
    expect(activityBounds.y + activityBounds.height).toBeLessThanOrEqual(
      viewports[0].height,
    );
    await expect(
      activity.locator('[data-bounded-scroll="activity-filters"]'),
    ).toHaveCSS("overflow-x", "auto");
    await page.keyboard.press("Escape");

    await page.goto("/settings/profile");
    await expect(
      page.locator('[data-bounded-scroll="settings-navigation"]'),
    ).toHaveCSS("overflow-x", "auto");

    await page.goto("/dashboard");
    await expect(page.locator("[data-decoration-boundary]")).toHaveCSS(
      "overflow",
      "hidden",
    );
  });

  test("layout remains usable at a 200 percent effective zoom", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width: 320, height: 568 },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();
    try {
      await auditRouteAtEveryViewport(page, "/");
      await loginViaUi(page, completedUser, /\/dashboard$/);
      await page.setViewportSize(viewports[0]);
      await assertResponsivePage(page, viewports[0]);
    } finally {
      await context.close();
    }
  });
});
