import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTodayDateString } from "@/lib/dashboard-utils";
import {
  withAuth,
  withAuthValidation,
  withErrorHandling,
  createSuccessResponse,
  AuthenticatedRequest,
} from "@/lib/api-helpers";
import { z } from "zod";

// Validation schema for log creation
const createLogSchema = z.object({
  reminderId: z.string().min(1, "Reminder ID is required"),
  action: z.enum(["completed", "dismissed", "snoozed", "missed"], {
    errorMap: () => ({ message: "Invalid action type" }),
  }),
  notes: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

// POST /api/logs - Create a new reminder log
async function createLogHandler(
  request: AuthenticatedRequest,
  validatedData: z.infer<typeof createLogSchema>
) {
  const { reminderId, action, notes, metadata } = validatedData;
  const userId = request.user.userId;
  const todayDate = getTodayDateString();

  // Verify the reminder belongs to the user
  const reminder = await prisma.reminder.findFirst({
    where: {
      id: reminderId,
      userId,
    },
  });

  if (!reminder) {
    throw new Error("Reminder not found or access denied");
  }

  // Check if there's already a log for this reminder today with the same action
  const existingLog = await prisma.reminderLog.findFirst({
    where: {
      userId,
      reminderId,
      date: todayDate,
      action,
    },
  });

  let log;

  if (action === "snoozed") {
    // For snooze actions, we always create a new log to track multiple snoozes
    const snoozeCount = await prisma.reminderLog.count({
      where: {
        userId,
        reminderId,
        date: todayDate,
        action: "snoozed",
      },
    });

    log = await prisma.reminderLog.create({
      data: {
        userId,
        reminderId,
        action,
        date: todayDate,
        snoozeCount: snoozeCount + 1,
        notes,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
  } else if (existingLog) {
    // For other actions, update the existing log instead of creating a duplicate
    log = await prisma.reminderLog.update({
      where: { id: existingLog.id },
      data: {
        timestamp: new Date(),
        notes,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
  } else {
    // Create a new log
    log = await prisma.reminderLog.create({
      data: {
        userId,
        reminderId,
        action,
        date: todayDate,
        notes,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
  }

  return createSuccessResponse({ log }, 201);
}

// GET /api/logs - Get logs for the authenticated user
async function getLogsHandler(request: AuthenticatedRequest) {
  const url = new URL(request.url);
  const date = url.searchParams.get("date") || getTodayDateString();
  const reminderId = url.searchParams.get("reminderId");

  const whereCondition: any = {
    userId: request.user.userId,
    date,
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
    orderBy: {
      timestamp: "desc",
    },
  });

  return createSuccessResponse({ logs });
}

// Export handlers with middleware
export async function POST(request: NextRequest) {
  const authHandler = await withAuth(
    withAuthValidation(createLogSchema, createLogHandler)
  );
  return withErrorHandling(authHandler)(request);
}

export async function GET(request: NextRequest) {
  const authHandler = await withAuth(getLogsHandler);
  return withErrorHandling(authHandler)(request);
}
