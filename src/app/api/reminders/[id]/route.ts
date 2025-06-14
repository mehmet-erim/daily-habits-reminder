import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateReminderSchema, formatDaysOfWeek } from "@/lib/validations";
import {
  withAuth,
  withAuthValidation,
  withErrorHandling,
  createSuccessResponse,
  createErrorResponse,
  verifyResourceOwnership,
  AuthenticatedRequest,
} from "@/lib/api-helpers";

// GET /api/reminders/[id] - Get single reminder
async function getReminderHandler(
  request: AuthenticatedRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Verify ownership and fetch reminder
  const reminder = await prisma.reminder.findFirst({
    where: {
      id,
      userId: request.user.userId,
    },
  });

  if (!reminder) {
    return createErrorResponse("Reminder not found", 404);
  }

  return createSuccessResponse({ reminder });
}

// PUT /api/reminders/[id] - Update reminder
async function updateReminderHandler(
  request: AuthenticatedRequest,
  validatedData: any,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Verify ownership
  const hasAccess = await verifyResourceOwnership(
    id,
    request.user.userId,
    "reminder"
  );

  if (!hasAccess) {
    return createErrorResponse("Reminder not found", 404);
  }

  // Prepare update data
  const updateData: any = { ...validatedData };

  // Format daysOfWeek if provided
  if (validatedData.daysOfWeek) {
    updateData.daysOfWeek = formatDaysOfWeek(validatedData.daysOfWeek);
  }

  // Update reminder in database
  const reminder = await prisma.reminder.update({
    where: { id },
    data: updateData,
  });

  return createSuccessResponse({ reminder });
}

// DELETE /api/reminders/[id] - Delete reminder
async function deleteReminderHandler(
  request: AuthenticatedRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Verify ownership
  const hasAccess = await verifyResourceOwnership(
    id,
    request.user.userId,
    "reminder"
  );

  if (!hasAccess) {
    return createErrorResponse("Reminder not found", 404);
  }

  // Delete reminder from database
  await prisma.reminder.delete({
    where: { id },
  });

  return createSuccessResponse({
    message: "Reminder deleted successfully",
  });
}

// Export handlers with middleware
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authHandler = await withAuth(getReminderHandler);
  return withErrorHandling(authHandler)(request, context);
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authHandler = await withAuth(
    withAuthValidation(updateReminderSchema, updateReminderHandler)
  );
  return withErrorHandling(authHandler)(request, context);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authHandler = await withAuth(deleteReminderHandler);
  return withErrorHandling(authHandler)(request, context);
}
