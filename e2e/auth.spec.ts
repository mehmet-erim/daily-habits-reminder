import { test, expect } from "@playwright/test";

test.describe("Authentication Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing auth state
    await page.context().clearCookies();
    await page.context().clearPermissions();
  });

  test("should display login page correctly", async ({ page }) => {
    await page.goto("/login");

    // Check page title and main heading
    await expect(page).toHaveTitle(/Wellness Tracker/);
    await expect(page.locator("h1, h2").first()).toContainText("Sign in");

    // Check form elements
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // Check form labels
    await expect(page.locator("label")).toContainText(["Email", "Password"]);
  });

  test("should show validation errors for empty form", async ({ page }) => {
    await page.goto("/login");

    // Try to submit empty form
    await page.click('button[type="submit"]');

    // Check for validation messages
    await expect(
      page.locator('[role="alert"], .error-message').first()
    ).toBeVisible();
  });

  test("should show error for invalid credentials", async ({ page }) => {
    await page.goto("/login");

    // Fill in invalid credentials
    await page.fill('input[name="email"]', "invalid@example.com");
    await page.fill('input[type="password"]', "wrongpassword");

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for error message
    await expect(
      page.locator('.error-message, [role="alert"]').first()
    ).toBeVisible();
    await expect(
      page.locator('.error-message, [role="alert"]').first()
    ).toContainText(/invalid/i);
  });

  test("should successfully login with valid credentials", async ({ page }) => {
    await page.goto("/login");

    // Fill in valid test credentials
    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[type="password"]', "testpassword123");

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL("/dashboard");

    // Check for dashboard elements
    await expect(page.locator("h1, h2").first()).toContainText(
      /dashboard|welcome/i
    );
  });

  test("should redirect unauthenticated users to login", async ({ page }) => {
    // Try to access protected route without auth
    await page.goto("/dashboard");

    // Should redirect to login
    await expect(page).toHaveURL("/login");
  });

  test("should logout successfully", async ({ page }) => {
    // First login
    await page.goto("/login");
    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[type="password"]', "testpassword123");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL("/dashboard");

    // Find and click logout button
    const logoutButton = page
      .locator(
        'button:has-text("Logout"), button:has-text("Sign out"), [aria-label="Logout"]'
      )
      .first();
    await expect(logoutButton).toBeVisible();
    await logoutButton.click();

    // Should redirect to login page
    await expect(page).toHaveURL("/login");

    // Verify logout by trying to access dashboard again
    await page.goto("/dashboard");
    await expect(page).toHaveURL("/login");
  });

  test("should maintain session across page reloads", async ({ page }) => {
    // Login
    await page.goto("/login");
    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[type="password"]', "testpassword123");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL("/dashboard");

    // Reload page
    await page.reload();

    // Should still be on dashboard
    await expect(page).toHaveURL("/dashboard");
    await expect(page.locator("h1, h2").first()).toContainText(
      /dashboard|welcome/i
    );
  });

  test("should handle network errors gracefully", async ({ page }) => {
    // Intercept network request and simulate error
    await page.route("/api/auth/login", (route) => {
      route.abort("failed");
    });

    await page.goto("/login");
    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[type="password"]', "testpassword123");
    await page.click('button[type="submit"]');

    // Should show network error message
    await expect(
      page.locator('.error-message, [role="alert"]').first()
    ).toBeVisible();
  });
});
