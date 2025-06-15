import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  withAuth,
  AuthenticatedRequest,
  createSuccessResponse,
  createErrorResponse,
} from "@/lib/api-helpers";
import { format } from "date-fns";

const handler = async (request: AuthenticatedRequest) => {
  try {
    const body = await request.json();
    const { action, reminderId, timestamp } = body;

    if (!action || !reminderId) {
      return createErrorResponse(
        "Missing required fields: action, reminderId",
        400
      );
    }

    // Validate action type - using the correct action names from the schema
    const validActions = ["completed", "snoozed", "dismissed"];
    if (!validActions.includes(action)) {
      return createErrorResponse(
        "Invalid action. Must be: completed, snoozed, or dismissed",
        400
      );
    }

    // Get reminder to validate it exists and user owns it
    const reminder = await prisma.reminder.findFirst({
      where: {
        id: reminderId,
        userId: request.user.userId,
      },
    });

    if (!reminder) {
      return createErrorResponse("Reminder not found or access denied", 404);
    }

    const actionTimestamp = timestamp ? new Date(timestamp) : new Date();
    const dateString = format(actionTimestamp, "yyyy-MM-dd");

    // Create log entry for the action
    const log = await prisma.reminderLog.create({
      data: {
        userId: request.user.userId,
        reminderId,
        action,
        timestamp: actionTimestamp,
        date: dateString,
        metadata: JSON.stringify({ source: "notification" }),
      },
    });

    // Handle specific actions
    let responseData: any = {
      success: true,
      action,
      reminderId,
      logId: log.id,
    };

    switch (action) {
      case "completed":
        responseData.message = "Reminder marked as completed";
        break;

      case "snoozed":
        // Store snooze count in the log entry
        await prisma.reminderLog.update({
          where: { id: log.id },
          data: {
            snoozeCount: reminder.snoozeDuration || 5,
            metadata: JSON.stringify({
              source: "notification",
              snoozeDuration: reminder.snoozeDuration || 5,
            }),
          },
        });

        responseData.message = `Reminder snoozed for ${
          reminder.snoozeDuration || 5
        } minutes`;
        responseData.snoozeMinutes = reminder.snoozeDuration || 5;
        break;

      case "dismissed":
        responseData.message = "Reminder dismissed";
        break;
    }

    return createSuccessResponse(responseData);
  } catch (error) {
    console.error("Error handling notification action:", error);
    return createErrorResponse("Internal server error", 500);
  }
};

export const POST = withAuth(handler);

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
