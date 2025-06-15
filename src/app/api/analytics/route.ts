import { NextRequest } from "next/server";
import { getAnalyticsData } from "@/lib/analytics";
import {
  withAuth,
  withErrorHandling,
  createSuccessResponse,
  AuthenticatedRequest,
} from "@/lib/api-helpers";

// GET /api/analytics - Get analytics data for the authenticated user
async function getAnalyticsHandler(request: AuthenticatedRequest) {
  const url = new URL(request.url);
  const days = parseInt(url.searchParams.get("days") || "30");

  // Validate days parameter
  if (days < 1 || days > 365) {
    throw new Error("Days parameter must be between 1 and 365");
  }

  const userId = request.user.userId;
  const analyticsData = await getAnalyticsData(userId);

  return createSuccessResponse({ analytics: analyticsData });
}

// Export handler with middleware
export async function GET(request: NextRequest) {
  const authHandler = await withAuth(getAnalyticsHandler);
  return withErrorHandling(authHandler)(request);
}
