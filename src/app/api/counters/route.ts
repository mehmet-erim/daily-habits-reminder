import { NextRequest } from "next/server";
import {
  withAuth,
  withAuthValidation,
  withErrorHandling,
  createSuccessResponse,
  parseQueryParams,
  AuthenticatedRequest,
} from "@/lib/api-helpers";
import { createCounterSchema } from "@/lib/validations";
import {
  getTodayCounters,
  getOrCreateCounter,
  getUserCounterNames,
} from "@/lib/counter-utils";

// GET /api/counters - Get today's counters or counter names for management
async function getCountersHandler(request: AuthenticatedRequest) {
  const params = parseQueryParams(request.url);
  const mode = params.getString("mode"); // "today" or "names"

  if (mode === "names") {
    // Get unique counter names for management/settings
    const counterNames = await getUserCounterNames(request.user.userId);
    return createSuccessResponse({ counterNames });
  }

  // Default: Get today's counters
  const counters = await getTodayCounters(request.user.userId);
  return createSuccessResponse({ counters });
}

// POST /api/counters - Create or get a counter for today
async function createCounterHandler(
  request: AuthenticatedRequest,
  validatedData: any
) {
  const { name, unit, iconName, color, dailyGoal, reminderId } = validatedData;

  // Get or create counter for today
  const counter = await getOrCreateCounter(
    request.user.userId,
    name,
    unit,
    iconName,
    color,
    dailyGoal,
    reminderId
  );

  return createSuccessResponse({ counter }, 201);
}

// Export handlers with middleware
export async function GET(request: NextRequest) {
  const authHandler = await withAuth(getCountersHandler);
  return withErrorHandling(authHandler)(request);
}

export async function POST(request: NextRequest) {
  const authHandler = await withAuth(
    withAuthValidation(createCounterSchema, createCounterHandler)
  );
  return withErrorHandling(authHandler)(request);
}
