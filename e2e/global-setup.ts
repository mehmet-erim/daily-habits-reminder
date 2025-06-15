import { chromium, FullConfig } from "@playwright/test";

async function globalSetup(config: FullConfig) {
  console.log("🚀 Starting global E2E test setup...");

  // Start browser for setup operations
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Wait for the development server to be ready
    const baseURL = config.projects[0].use.baseURL || "http://localhost:3000";
    console.log(`⏳ Waiting for server at ${baseURL}...`);

    // Retry connecting to the server
    let retries = 0;
    const maxRetries = 30;

    while (retries < maxRetries) {
      try {
        await page.goto(baseURL);
        console.log("✅ Server is ready!");
        break;
      } catch (error) {
        retries++;
        console.log(`⏳ Server not ready, retry ${retries}/${maxRetries}...`);
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    if (retries >= maxRetries) {
      throw new Error("Server failed to start within timeout");
    }

    // Setup test data
    console.log("📊 Setting up test data...");

    // You can make API calls here to seed test data
    // Example:
    // await page.request.post('/api/test/seed', {
    //   data: { /* seed data */ }
    // })

    // Create test user session if needed
    console.log("👤 Creating test user session...");

    // Navigate to login page and create session
    await page.goto("/login");

    // Check if login form exists
    const loginForm = await page.locator("form").first();
    if (await loginForm.isVisible()) {
      // Fill in test credentials
      await page.fill('input[name="email"]', "test@example.com");
      await page.fill('input[name="password"]', "testpassword123");
      await page.click('button[type="submit"]');

      // Wait for redirect after login
      await page.waitForURL("/dashboard", { timeout: 10000 });
      console.log("✅ Test user session created");
    }

    // Store authentication state
    await page.context().storageState({ path: "e2e/auth-state.json" });
    console.log("💾 Authentication state saved");
  } catch (error) {
    console.error("❌ Global setup failed:", error);
    throw error;
  } finally {
    await browser.close();
  }

  console.log("✅ Global E2E test setup completed!");
}

export default globalSetup;
