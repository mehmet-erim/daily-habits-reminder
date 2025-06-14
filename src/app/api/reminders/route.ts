import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createReminderSchema, formatDaysOfWeek } from "@/lib/validations";
import {
  withAuth,
  withAuthValidation,
  withErrorHandling,
  createSuccessResponse,
  parseQueryParams,
  buildWhereCondition,
  AuthenticatedRequest,
} from "@/lib/api-helpers";

// GET /api/reminders - Get all reminders for authenticated user
async function getRemindersHandler(request: AuthenticatedRequest) {
  const params = parseQueryParams(request.url);

  // Get filter parameters
  const category = params.getString("category");
  const isActive = params.getBoolean("active");

  // Build filter conditions
  const filters: Record<string, any> = {};

  if (category && category !== "all") {
    filters.category = category;
  }

  if (isActive !== undefined) {
    filters.isActive = isActive;
  }

  const where = buildWhereCondition({ userId: request.user.userId }, filters);

  // Fetch reminders with ordering
  const reminders = await prisma.reminder.findMany({
    where,
    orderBy: [{ isActive: "desc" }, { reminderTime: "asc" }, { title: "asc" }],
  });

  return createSuccessResponse({ reminders });
}

// POST /api/reminders - Create new reminder
async function createReminderHandler(
  request: AuthenticatedRequest,
  validatedData: any
) {
  // Create reminder in database
  const reminder = await prisma.reminder.create({
    data: {
      ...validatedData,
      daysOfWeek: formatDaysOfWeek(validatedData.daysOfWeek),
      userId: request.user.userId,
    },
  });

  return createSuccessResponse({ reminder }, 201);
}

// Export handlers with middleware
export async function GET(request: NextRequest) {
  const authHandler = await withAuth(getRemindersHandler);
  return withErrorHandling(authHandler)(request);
}

export async function POST(request: NextRequest) {
  const authHandler = await withAuth(
    withAuthValidation(createReminderSchema, createReminderHandler)
  );
  return withErrorHandling(authHandler)(request);
}
