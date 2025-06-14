"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  authenticateUser,
  createSessionToken,
  getUserFromToken,
} from "../auth";

// Validation schemas
const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Constants
const COOKIE_NAME = "auth-token";
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 7, // 7 days
  path: "/",
};

/**
 * Login action
 */
export async function loginAction(formData: FormData) {
  try {
    const data = {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    };

    // Validate input
    const result = loginSchema.safeParse(data);
    if (!result.success) {
      return {
        error: result.error.errors[0]?.message || "Invalid input",
      };
    }

    // Authenticate user
    const user = await authenticateUser(
      result.data.email,
      result.data.password
    );
    if (!user) {
      return {
        error: "Invalid email or password",
      };
    }

    // Create session token
    const token = createSessionToken(user);

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, COOKIE_OPTIONS);

    // Redirect to dashboard
    redirect("/dashboard");
  } catch (error) {
    console.error("Login error:", error);
    return {
      error: "An error occurred during login",
    };
  }
}

/**
 * Logout action
 */
export async function logoutAction() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
    redirect("/login");
  } catch (error) {
    console.error("Logout error:", error);
    return {
      error: "An error occurred during logout",
    };
  }
}

/**
 * Get current session
 */
export async function getSession() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) return null;

    const user = await getUserFromToken(token);
    return user;
  } catch (error) {
    console.error("Session error:", error);
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return !!session;
}

/**
 * Require authentication (redirect if not authenticated)
 */
export async function requireAuth() {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    redirect("/login");
  }
}

/**
 * Get user data or redirect to login
 */
export async function getCurrentUser() {
  const user = await getSession();
  if (!user) {
    redirect("/login");
  }
  return user;
}
