import { test, expect } from "@playwright/test";

test.describe("Reminder Management", () => {
  test("should display reminders page correctly", async ({ page }) => {
    await page.goto("/reminders");

    await expect(page).toHaveTitle(/Reminders/);
    await expect(page.locator("h1").first()).toContainText("Reminders");
    await expect(
      page.locator('button:has-text("Add"), button:has-text("New")')
    ).toBeVisible();
  });

  test("should create a new reminder", async ({ page }) => {
    await page.goto("/reminders");

    await page.click('button:has-text("Add"), button:has-text("New")');

    await page.fill('input[name="title"]', "Test Reminder");
    await page.fill(
      'textarea[name="description"], input[name="description"]',
      "Test description"
    );
    await page.fill('input[type="time"]', "09:00");

    await page.click(
      'button[type="submit"]:has-text("Save"), button:has-text("Create")'
    );

    await expect(page).toHaveURL("/reminders");
    await expect(page.locator("text=Test Reminder")).toBeVisible();
  });

  test("should mark reminder as completed", async ({ page }) => {
    await page.goto("/dashboard");

    const reminderCard = page
      .locator('[data-testid="reminder-card"], .reminder-card')
      .first();

    if (await reminderCard.isVisible()) {
      const doneButton = reminderCard.locator(
        'button:has-text("Done"), button:has-text("Complete")'
      );
      await doneButton.click();

      await expect(
        reminderCard.locator('.completed, [data-status="completed"]')
      ).toBeVisible();
    }
  });
});
