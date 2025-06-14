"use client";

export interface LoginData {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
}

export interface AuthResponse {
  user?: User;
  message?: string;
  error?: string;
}

/**
 * Login user with email and password
 */
export async function login(data: LoginData): Promise<AuthResponse> {
  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      return { error: result.error || "Login failed" };
    }

    return result;
  } catch (error) {
    console.error("Login error:", error);
    return { error: "Network error. Please try again." };
  }
}

/**
 * Logout current user
 */
export async function logout(): Promise<AuthResponse> {
  try {
    const response = await fetch("/api/auth/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const result = await response.json();

    if (!response.ok) {
      return { error: result.error || "Logout failed" };
    }

    // Reload page to clear any cached state
    window.location.href = "/login";

    return result;
  } catch (error) {
    console.error("Logout error:", error);
    return { error: "Network error. Please try again." };
  }
}

/**
 * Get current user session
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const response = await fetch("/api/auth/me", {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    return result.user || null;
  } catch (error) {
    console.error("Get current user error:", error);
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return !!user;
}
