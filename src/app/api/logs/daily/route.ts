import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  withAuth,
  withErrorHandling,
  createSuccessResponse,
  AuthenticatedRequest,
} from "@/lib/api-helpers";

// GET /api/logs/daily - Get logs for a date range
async function getDailyLogsHandler(request: AuthenticatedRequest) {
  const url = new URL(request.url);
  const startDate = url.searchParams.get("startDate");
  const endDate = url.searchParams.get("endDate");
  const reminderId = url.searchParams.get("reminderId");

  if (!startDate || !endDate) {
    throw new Error("Both startDate and endDate are required");
  }

  // Validate date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
    throw new Error("Invalid date format. Use YYYY-MM-DD");
  }

  const whereCondition: any = {
    userId: request.user.userId,
    date: {
      gte: startDate,
      lte: endDate,
    },
  };

  if (reminderId) {
    whereCondition.reminderId = reminderId;
  }

  const logs = await prisma.reminderLog.findMany({
    where: whereCondition,
    include: {
      reminder: {
        select: {
          id: true,
          title: true,
          category: true,
        },
      },
    },
    orderBy: [{ date: "desc" }, { timestamp: "desc" }],
  });

  // Group logs by date for easier frontend consumption
  const logsByDate: Record<string, any[]> = {};

  logs.forEach((log) => {
    if (!logsByDate[log.date]) {
      logsByDate[log.date] = [];
    }
    logsByDate[log.date].push(log);
  });

  return createSuccessResponse({
    logs,
    logsByDate,
    dateRange: {
      startDate,
      endDate,
    },
    totalLogs: logs.length,
  });
}

// Export handlers with middleware
export async function GET(request: NextRequest) {
  const authHandler = await withAuth(getDailyLogsHandler);
  return withErrorHandling(authHandler)(request);
}
