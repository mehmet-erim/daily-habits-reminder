import { NextRequest } from "next/server";
import {
  withAuth,
  withErrorHandling,
  createSuccessResponse,
  parseQueryParams,
  AuthenticatedRequest,
} from "@/lib/api-helpers";
import {
  getCounterHistory,
  getCounterStats,
  formatDate,
} from "@/lib/counter-utils";

// GET /api/counters/history - Get counter history for date range
async function getCounterHistoryHandler(request: AuthenticatedRequest) {
  const params = parseQueryParams(request.url);

  const name = params.getString("name");
  const startDate = params.getString("startDate");
  const endDate = params.getString("endDate");
  const includeStats = params.getBoolean("includeStats") ?? false;
  const days = params.getNumber("days") ?? 7;

  if (!name) {
    return createSuccessResponse({ error: "Counter name is required" }, 400);
  }

  // If no date range provided, use last N days
  let start: string;
  let end: string;

  if (startDate && endDate) {
    start = startDate;
    end = endDate;
  } else {
    const endDateObj = new Date();
    const startDateObj = new Date();
    startDateObj.setDate(endDateObj.getDate() - days + 1);

    start = formatDate(startDateObj);
    end = formatDate(endDateObj);
  }

  // Validate date format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(start) || !dateRegex.test(end)) {
    return createSuccessResponse(
      { error: "Dates must be in YYYY-MM-DD format" },
      400
    );
  }

  // Get counter history
  const history = await getCounterHistory(
    request.user.userId,
    name,
    start,
    end
  );

  let stats = null;
  if (includeStats) {
    stats = await getCounterStats(request.user.userId, name, days);
  }

  return createSuccessResponse({
    history,
    stats,
    dateRange: {
      startDate: start,
      endDate: end,
    },
  });
}

// Export handlers with middleware
export async function GET(request: NextRequest) {
  const authHandler = await withAuth(getCounterHistoryHandler);
  return withErrorHandling(authHandler)(request);
}
