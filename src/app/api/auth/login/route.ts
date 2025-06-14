import { NextRequest } from "next/server";
import { z } from "zod";
import { authenticateUser, createSessionToken } from "@/lib/auth";
import {
  withValidation,
  withErrorHandling,
  createSuccessResponse,
  createErrorResponse,
  COOKIE_OPTIONS,
  COOKIE_NAME,
} from "@/lib/api-helpers";

// Validation schema
const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// POST /api/auth/login
async function loginHandler(
  request: NextRequest,
  validatedData: z.infer<typeof loginSchema>
) {
  const { email, password } = validatedData;

  // Authenticate user
  const user = await authenticateUser(email, password);
  if (!user) {
    return createErrorResponse("Invalid email or password", 401);
  }

  // Create session token
  const token = createSessionToken(user);

  // Create response with user data
  const response = createSuccessResponse({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    message: "Login successful",
  });

  // Set auth cookie
  response.cookies.set(COOKIE_NAME, token, COOKIE_OPTIONS);

  return response;
}

export const POST = withErrorHandling(
  withValidation(loginSchema, loginHandler)
);
