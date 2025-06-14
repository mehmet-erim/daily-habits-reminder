import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { Loader2 } from "lucide-react";
import { getSession } from "@/lib/actions/auth.actions";

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export async function ProtectedRoute({
  children,
  fallback,
}: ProtectedRouteProps) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return <>{children}</>;
}

// Loading component for protected routes
export function ProtectedRouteLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
