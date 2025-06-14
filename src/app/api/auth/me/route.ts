import { NextRequest } from "next/server";
import {
  withAuth,
  withErrorHandling,
  createSuccessResponse,
  AuthenticatedRequest,
} from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

// GET /api/auth/me
async function meHandler(request: AuthenticatedRequest) {
  // Get full user data
  const user = await prisma.user.findUnique({
    where: { id: request.user.userId },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    return createSuccessResponse({ user: null }, 404);
  }

  return createSuccessResponse({
    user,
    authenticated: true,
  });
}

export async function GET(request: NextRequest) {
  const authHandler = await withAuth(meHandler);
  return withErrorHandling(authHandler)(request);
}
