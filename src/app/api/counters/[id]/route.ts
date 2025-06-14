import { NextRequest } from "next/server";
import {
  withAuth,
  withAuthValidation,
  withErrorHandling,
  createSuccessResponse,
  parseQueryParams,
  AuthenticatedRequest,
} from "@/lib/api-helpers";
import {
  incrementCounterSchema,
  setCounterValueSchema,
  updateCounterSettingsSchema,
} from "@/lib/validations";
import {
  incrementCounter,
  setCounterValue,
  resetCounter,
  updateCounterSettings,
} from "@/lib/counter-utils";
import { prisma } from "@/lib/prisma";

interface CounterParams {
  params: {
    id: string;
  };
}

// GET /api/counters/[id] - Get specific counter details
async function getCounterHandler(
  request: AuthenticatedRequest,
  { params }: CounterParams
) {
  const counter = await prisma.counter.findFirst({
    where: {
      id: params.id,
      userId: request.user.userId,
    },
    include: {
      reminder: {
        select: {
          id: true,
          title: true,
          category: true,
        },
      },
    },
  });

  if (!counter) {
    return createSuccessResponse({ error: "Counter not found" }, 404);
  }

  return createSuccessResponse({ counter });
}

// PUT /api/counters/[id] - Update counter (increment, set value, or update settings)
async function updateCounterHandler(
  request: AuthenticatedRequest,
  { params }: CounterParams
) {
  const body = await request.json();
  const queryParams = parseQueryParams(request.url);
  const action = queryParams.getString("action"); // "increment", "set", "reset", or "settings"

  let counter;

  switch (action) {
    case "increment": {
      const validatedData = incrementCounterSchema.parse(body);
      counter = await incrementCounter(
        request.user.userId,
        params.id,
        validatedData.amount
      );
      break;
    }

    case "set": {
      const validatedData = setCounterValueSchema.parse(body);
      counter = await setCounterValue(
        request.user.userId,
        params.id,
        validatedData.value
      );
      break;
    }

    case "reset": {
      counter = await resetCounter(request.user.userId, params.id);
      break;
    }

    case "settings": {
      const validatedData = updateCounterSettingsSchema.parse(body);

      // First get the current counter to get the name
      const currentCounter = await prisma.counter.findFirst({
        where: {
          id: params.id,
          userId: request.user.userId,
        },
      });

      if (!currentCounter) {
        return createSuccessResponse({ error: "Counter not found" }, 404);
      }

      await updateCounterSettings(
        request.user.userId,
        currentCounter.name,
        validatedData
      );

      // Return updated counter
      counter = await prisma.counter.findFirst({
        where: {
          id: params.id,
          userId: request.user.userId,
        },
      });
      break;
    }

    default:
      return createSuccessResponse(
        { error: "Invalid action. Use: increment, set, reset, or settings" },
        400
      );
  }

  return createSuccessResponse({ counter });
}

// DELETE /api/counters/[id] - Soft delete counter (set isActive to false)
async function deleteCounterHandler(
  request: AuthenticatedRequest,
  { params }: CounterParams
) {
  // Soft delete by setting isActive to false for all counters with this name
  const counter = await prisma.counter.findFirst({
    where: {
      id: params.id,
      userId: request.user.userId,
    },
  });

  if (!counter) {
    return createSuccessResponse({ error: "Counter not found" }, 404);
  }

  // Update all counters with this name to inactive
  await prisma.counter.updateMany({
    where: {
      userId: request.user.userId,
      name: counter.name,
    },
    data: {
      isActive: false,
    },
  });

  return createSuccessResponse({ message: "Counter deleted successfully" });
}

// Export handlers with middleware
export async function GET(request: NextRequest, context: CounterParams) {
  const authHandler = await withAuth((req: AuthenticatedRequest) =>
    getCounterHandler(req, context)
  );
  return withErrorHandling(authHandler)(request);
}

export async function PUT(request: NextRequest, context: CounterParams) {
  const authHandler = await withAuth((req: AuthenticatedRequest) =>
    updateCounterHandler(req, context)
  );
  return withErrorHandling(authHandler)(request);
}

export async function DELETE(request: NextRequest, context: CounterParams) {
  const authHandler = await withAuth((req: AuthenticatedRequest) =>
    deleteCounterHandler(req, context)
  );
  return withErrorHandling(authHandler)(request);
}
