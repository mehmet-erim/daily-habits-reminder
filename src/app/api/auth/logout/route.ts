import { NextRequest } from "next/server";
import {
  withErrorHandling,
  createSuccessResponse,
  COOKIE_NAME,
} from "@/lib/api-helpers";

// POST /api/auth/logout
async function logoutHandler(request: NextRequest) {
  // Create response
  const response = createSuccessResponse({
    message: "Logout successful",
  });

  // Clear auth cookie
  response.cookies.delete(COOKIE_NAME);

  return response;
}

export const POST = withErrorHandling(logoutHandler);
