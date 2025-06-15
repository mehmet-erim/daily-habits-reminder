import { FullConfig } from "@playwright/test";
import { unlink } from "fs/promises";
import { existsSync } from "fs";

async function globalTeardown(config: FullConfig) {
  console.log("🧹 Starting global E2E test teardown...");

  try {
    // Clean up authentication state file
    const authStatePath = "e2e/auth-state.json";
    if (existsSync(authStatePath)) {
      await unlink(authStatePath);
      console.log("🗑️ Authentication state file cleaned up");
    }

    // Clean up test data if needed
    console.log("🧹 Cleaning up test data...");

    // You can make API calls here to clean up test data
    // Example:
    // const response = await fetch('http://localhost:3000/api/test/cleanup', {
    //   method: 'POST'
    // })

    // Clean up any temporary files
    console.log("📁 Cleaning up temporary files...");

    // Remove any screenshots or videos from failed tests if needed
    // (Playwright handles this automatically in most cases)

    console.log("✅ Global E2E test teardown completed!");
  } catch (error) {
    console.error("❌ Global teardown failed:", error);
    // Don't throw error in teardown to avoid masking test failures
  }
}

export default globalTeardown;
