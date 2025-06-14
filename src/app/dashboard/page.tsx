import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import { getCurrentUser } from "@/lib/actions/auth.actions";
import { LogoutButton } from "@/components/logout-button";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {user.name || user.email}!
            </p>
          </div>
          <LogoutButton />
        </div>

        {/* User Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              User Information
            </CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="text-sm font-medium text-muted-foreground">
                Email:
              </span>
              <p className="text-foreground">{user.email}</p>
            </div>
            {user.name && (
              <div>
                <span className="text-sm font-medium text-muted-foreground">
                  Name:
                </span>
                <p className="text-foreground">{user.name}</p>
              </div>
            )}
            <div>
              <span className="text-sm font-medium text-muted-foreground">
                User ID:
              </span>
              <p className="text-xs text-muted-foreground font-mono">
                {user.id}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Placeholder Cards for Future Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Today's Reminders</CardTitle>
              <CardDescription>
                Your wellness reminders for today
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Coming soon...</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Daily Stats</CardTitle>
              <CardDescription>
                Your daily completion statistics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Coming soon...</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Fast access to common actions</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Coming soon...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
