import { expect, test } from "@playwright/test";
import {
  assertNoHorizontalOverflow,
  BrowserFixtures,
  loginViaUi,
} from "./support.mjs";

test.describe.serial("responsive and accessibility acceptance", () => {
  let fixtures;
  let user;

  test.beforeAll(async () => {
    fixtures = new BrowserFixtures();
    user = await fixtures.createUser("responsive", { completed: true });
  });

  test.afterAll(async () => {
    await fixtures.cleanup();
  });

  for (const theme of ["light", "dark"]) {
    test(`${theme} public and application layouts remain operable`, async ({ page }) => {
      await page.addInitScript((selectedTheme) => {
        localStorage.setItem("theme", selectedTheme);
      }, theme);
      await page.emulateMedia({
        colorScheme: theme,
        reducedMotion: "reduce",
      });
      await page.goto("/");
      await expect(page.locator("html")).toHaveClass(new RegExp(theme));
      await assertNoHorizontalOverflow(page);
      await page.keyboard.press("Tab");
      await expect(page.locator(":focus-visible")).toHaveCount(1);

      await loginViaUi(page, user, /\/dashboard$/);
      await assertNoHorizontalOverflow(page);
      await expect(page.getByRole("button", { name: "Add inventory" })).toBeDisabled();
      await expect(page.getByRole("button", { name: "Record sale" })).toBeDisabled();
      const unnamedControls = await page.locator("button, a[href], input, select").evaluateAll(
        (controls) =>
          controls.filter((control) => {
            if (control.hasAttribute("disabled") || control.getAttribute("aria-hidden") === "true") {
              return false;
            }
            const text = control.textContent?.trim();
            const label = control.getAttribute("aria-label");
            const labelledBy = control.getAttribute("aria-labelledby");
            const title = control.getAttribute("title");
            return !text && !label && !labelledBy && !title;
          }).length,
      );
      expect(unnamedControls).toBe(0);

      const openNavigation = page.getByRole("button", { name: "Open navigation" });
      if (await openNavigation.isVisible()) {
        const box = await openNavigation.boundingBox();
        expect(box.width).toBeGreaterThanOrEqual(40);
        expect(box.height).toBeGreaterThanOrEqual(40);
        await openNavigation.click();
        await expect(page.getByRole("dialog", { name: "Workspace navigation" })).toBeVisible();
        await page.keyboard.press("Escape");
        await expect(page.getByRole("dialog", { name: "Workspace navigation" })).toHaveCount(0);
        await expect(openNavigation).toBeFocused();
      }

      const activityTrigger = page.getByRole("button", { name: /Activity,/ });
      await activityTrigger.click();
      await expect(page.getByRole("dialog", { name: "Activity" })).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog", { name: "Activity" })).toHaveCount(0);
      await expect(activityTrigger).toBeFocused();

      await activityTrigger.click();
      await page.getByRole("link", { name: "Manage" }).click();
      await expect(page).toHaveURL(/\/settings\/preferences#activity$/);
      await expect(page.getByRole("heading", { name: "Activity" })).toBeVisible();
      await assertNoHorizontalOverflow(page);
    });
  }
});
