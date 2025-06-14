import { NextRequest, NextResponse } from "next/server";
import { ZodSchema, ZodError } from "zod";
import { verifyJWT, JWTPayload } from "./auth";
import { prisma } from "./prisma";

// Constants
export const COOKIE_NAME = "auth-token";
export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 7, // 7 days
  path: "/",
};

// Types
export interface AuthenticatedRequest extends NextRequest {
  user: JWTPayload;
}

export interface ApiError {
  error: string;
  details?: any;
}

export type ApiResponse<T = any> = NextResponse<T | ApiError>;

/**
 * Authentication middleware for API routes
 */
export async function withAuth<T extends (...args: any[]) => any>(
  handler: (
    request: AuthenticatedRequest,
    ...args: any[]
  ) => Promise<NextResponse>
): Promise<(request: NextRequest, ...args: any[]) => Promise<NextResponse>> {
  return async (request: NextRequest, ...args: any[]) => {
    try {
      // Get token from cookie
      const token = request.cookies.get(COOKIE_NAME)?.value;

      if (!token) {
        return createErrorResponse("Authentication required", 401);
      }

      // Verify token
      const payload = verifyJWT(token);
      if (!payload || !payload.userId) {
        return createErrorResponse("Invalid or expired token", 401);
      }

      // Verify user exists
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true },
      });

      if (!user) {
        return createErrorResponse("User not found", 401);
      }

      // Add user to request
      const authenticatedRequest = request as AuthenticatedRequest;
      authenticatedRequest.user = payload;

      return handler(authenticatedRequest, ...args);
    } catch (error) {
      console.error("Authentication error:", error);
      return createErrorResponse("Authentication failed", 401);
    }
  };
}

/**
 * Validation middleware for API routes (non-authenticated)
 */
export function withValidation<T>(
  schema: ZodSchema<T>,
  handler: (
    request: NextRequest,
    validatedData: T,
    ...args: any[]
  ) => Promise<NextResponse>
): (request: NextRequest, ...args: any[]) => Promise<NextResponse> {
  return async (request: NextRequest, ...args: any[]) => {
    try {
      const body = await request.json();
      const validatedData = schema.parse(body);
      return handler(request, validatedData, ...args);
    } catch (error) {
      if (error instanceof ZodError) {
        return createErrorResponse("Validation failed", 400, error.errors);
      }
      console.error("Validation error:", error);
      return createErrorResponse("Invalid request data", 400);
    }
  };
}

/**
 * Validation middleware for authenticated API routes
 */
export function withAuthValidation<T>(
  schema: ZodSchema<T>,
  handler: (
    request: AuthenticatedRequest,
    validatedData: T,
    ...args: any[]
  ) => Promise<NextResponse>
): (request: AuthenticatedRequest, ...args: any[]) => Promise<NextResponse> {
  return async (request: AuthenticatedRequest, ...args: any[]) => {
    try {
      const body = await request.json();
      const validatedData = schema.parse(body);
      return handler(request, validatedData, ...args);
    } catch (error) {
      if (error instanceof ZodError) {
        return createErrorResponse("Validation failed", 400, error.errors);
      }
      console.error("Validation error:", error);
      return createErrorResponse("Invalid request data", 400);
    }
  };
}

/**
 * Error handling wrapper for API routes
 */
export function withErrorHandling<T extends (...args: any[]) => any>(
  handler: T
): T {
  return (async (...args: any[]) => {
    try {
      return await handler(...args);
    } catch (error) {
      console.error("API Error:", error);
      return createErrorResponse("Internal server error", 500);
    }
  }) as T;
}

/**
 * Resource ownership verification
 */
export async function verifyResourceOwnership(
  resourceId: string,
  userId: string,
  resourceType: "reminder" // Add more resource types as needed
): Promise<boolean> {
  try {
    switch (resourceType) {
      case "reminder":
        const reminder = await prisma.reminder.findFirst({
          where: { id: resourceId, userId },
          select: { id: true },
        });
        return !!reminder;
      default:
        return false;
    }
  } catch (error) {
    console.error("Resource ownership verification error:", error);
    return false;
  }
}

/**
 * Create success response
 */
export function createSuccessResponse<T>(
  data: T,
  status: number = 200
): NextResponse<T> {
  return NextResponse.json(data, { status });
}

/**
 * Create error response
 */
export function createErrorResponse(
  message: string,
  status: number = 500,
  details?: any
): NextResponse<ApiError> {
  const error: ApiError = { error: message };
  if (details) {
    error.details = details;
  }
  return NextResponse.json(error, { status });
}

/**
 * Parse query parameters with type safety
 */
export function parseQueryParams(url: string) {
  const { searchParams } = new URL(url);

  return {
    getString: (key: string, defaultValue?: string) =>
      searchParams.get(key) || defaultValue,

    getBoolean: (key: string, defaultValue?: boolean) => {
      const value = searchParams.get(key);
      if (value === null) return defaultValue;
      return value === "true";
    },

    getNumber: (key: string, defaultValue?: number) => {
      const value = searchParams.get(key);
      if (value === null) return defaultValue;
      const parsed = parseInt(value, 10);
      return isNaN(parsed) ? defaultValue : parsed;
    },

    getArray: (key: string, separator: string = ",") => {
      const value = searchParams.get(key);
      return value ? value.split(separator).map((item) => item.trim()) : [];
    },
  };
}

/**
 * Build database filter conditions
 */
export function buildWhereCondition(
  baseWhere: any,
  filters: Record<string, any>
) {
  const where = { ...baseWhere };

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      where[key] = value;
    }
  });

  return where;
}

/**
 * Pagination helper
 */
export function getPaginationParams(url: string) {
  const { searchParams } = new URL(url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);
  const skip = (page - 1) * limit;

  return {
    page: Math.max(1, page),
    limit: Math.min(Math.max(1, limit), 100), // Cap at 100
    skip,
    take: Math.min(Math.max(1, limit), 100),
  };
}

/**
 * Combine multiple middleware functions
 */
export function combineMiddleware<T extends (...args: any[]) => any>(
  ...middlewares: Array<(handler: T) => T>
): (handler: T) => T {
  return (handler: T) => {
    return middlewares.reduce((acc, middleware) => middleware(acc), handler);
  };
}
