# API Refactoring Documentation

## Overview

This document outlines the major refactoring changes made to the API architecture to eliminate code duplication, improve maintainability, and migrate from server actions to API routes.

## Key Changes

### 1. Authentication Migration

**Before**: Server actions in `src/lib/actions/auth.actions.ts`
**After**: API routes in `src/app/api/auth/`

- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout  
- `GET /api/auth/me` - Get current user session

### 2. Cookie Name Fix

**Issue**: API routes were looking for cookie named "token" but auth actions were setting "auth-token"
**Solution**: Standardized on "auth-token" across all routes

### 3. API Helpers Library

Created `src/lib/api-helpers.ts` with reusable utilities:

#### Authentication Middleware
```typescript
withAuth(handler) // Adds authentication to API routes
```

#### Validation Middleware
```typescript
withValidation(schema, handler) // For non-authenticated routes
withAuthValidation(schema, handler) // For authenticated routes
```

#### Error Handling
```typescript
withErrorHandling(handler) // Wraps routes with try-catch
createSuccessResponse(data, status) // Standardized success responses
createErrorResponse(message, status, details) // Standardized error responses
```

#### Resource Ownership
```typescript
verifyResourceOwnership(resourceId, userId, resourceType) // Checks ownership
```

#### Query Parsing
```typescript
parseQueryParams(url) // Type-safe query parameter parsing
buildWhereCondition(baseWhere, filters) // Database filter building
```

### 4. Refactored API Routes

#### Reminders API (`/api/reminders`)
- **GET**: List reminders with filtering
- **POST**: Create new reminder

#### Individual Reminder API (`/api/reminders/[id]`)
- **GET**: Get single reminder
- **PUT**: Update reminder
- **DELETE**: Delete reminder

## Benefits

### 1. Code Reuse
- Authentication logic centralized in `withAuth` middleware
- Validation logic reusable across routes
- Error handling standardized
- Response formatting consistent

### 2. Type Safety
- TypeScript interfaces for all request/response types
- Authenticated request type with user context
- Proper parameter parsing with type safety

### 3. Security
- Consistent authentication checks
- Resource ownership verification
- Proper error handling without information leakage

### 4. Maintainability
- Single source of truth for API patterns
- Easy to add new routes using existing middleware
- Consistent error messages and status codes

## Usage Examples

### Creating a New Authenticated API Route

```typescript
import { withAuth, withErrorHandling, createSuccessResponse } from "@/lib/api-helpers";

async function handler(request: AuthenticatedRequest) {
  // Your logic here - request.user contains authenticated user data
  return createSuccessResponse({ data: "success" });
}

export async function GET(request: NextRequest) {
  const authHandler = await withAuth(handler);
  return withErrorHandling(authHandler)(request);
}
```

### Creating a Route with Validation

```typescript
import { withAuth, withAuthValidation, withErrorHandling } from "@/lib/api-helpers";
import { mySchema } from "@/lib/validations";

async function handler(request: AuthenticatedRequest, validatedData: MyDataType) {
  // Your logic here - data is already validated
  return createSuccessResponse({ result: validatedData });
}

export async function POST(request: NextRequest) {
  const authHandler = await withAuth(
    withAuthValidation(mySchema, handler)
  );
  return withErrorHandling(authHandler)(request);
}
```

## Migration Guide

### For Frontend Components

Replace server action imports:
```typescript
// Before
import { loginAction } from "@/lib/actions/auth.actions";

// After  
import { login } from "@/lib/auth-client";
```

### For New API Routes

1. Use the middleware helpers from `@/lib/api-helpers`
2. Follow the established patterns for authentication and validation
3. Use consistent response formatting
4. Implement proper error handling

## Constants

All API-related constants are centralized in `api-helpers.ts`:

```typescript
export const COOKIE_NAME = "auth-token";
export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 7, // 7 days
  path: "/",
};
```

## Error Handling

Standardized error responses:
```typescript
{
  error: "Error message",
  details?: any // Optional validation errors or additional context
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error 