import { NextRequest } from "next/server";
import { getDailyStats, getTodayDateString } from "@/lib/dashboard-utils";
import {
  withAuth,
  withErrorHandling,
  createSuccessResponse,
  parseQueryParams,
  AuthenticatedRequest,
} from "@/lib/api-helpers";

// GET /api/dashboard/daily-stats - Get daily statistics
async function getDailyStatsHandler(request: AuthenticatedRequest) {
  const params = parseQueryParams(request.url);
  const date = params.getString("date") || getTodayDateString();

  const stats = await getDailyStats(request.user.userId, date);
  return createSuccessResponse({ stats });
}

// Export handler with middleware
export async function GET(request: NextRequest) {
  const authHandler = await withAuth(getDailyStatsHandler);
  return withErrorHandling(authHandler)(request);
}
