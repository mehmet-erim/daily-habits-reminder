import { NextRequest } from "next/server";
import { getTodayReminders } from "@/lib/dashboard-utils";
import {
  withAuth,
  withErrorHandling,
  createSuccessResponse,
  AuthenticatedRequest,
} from "@/lib/api-helpers";

// GET /api/dashboard/today-reminders - Get today's reminders with status
async function getTodayRemindersHandler(request: AuthenticatedRequest) {
  const reminders = await getTodayReminders(request.user.userId);
  return createSuccessResponse({ reminders });
}

// Export handler with middleware
export async function GET(request: NextRequest) {
  const authHandler = await withAuth(getTodayRemindersHandler);
  return withErrorHandling(authHandler)(request);
}
