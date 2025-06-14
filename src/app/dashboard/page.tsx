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
import { TodayReminders } from "@/components/TodayReminders";
import { DailyStats } from "@/components/DailyStats";
import { QuickActions } from "@/components/QuickActions";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Wellness Dashboard
            </h1>
            <p className="text-muted-foreground">
              Welcome back, {user.name || user.email}!
            </p>
          </div>
          <LogoutButton />
        </div>

        {/* Main Dashboard Grid - Mobile First Responsive */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Today's Reminders (Full width on mobile) */}
          <div className="lg:col-span-2 space-y-6">
            <TodayReminders userId={user.id} />

            {/* Stats Row on Mobile, Stats in Right Column on Desktop */}
            <div className="lg:hidden">
              <DailyStats userId={user.id} />
            </div>
          </div>

          {/* Right Column - Stats and Quick Actions (Desktop only) */}
          <div className="hidden lg:block space-y-6">
            <DailyStats userId={user.id} />
            <QuickActions userId={user.id} />
          </div>
        </div>

        {/* Quick Actions on Mobile (Hidden on Desktop) */}
        <div className="lg:hidden">
          <QuickActions userId={user.id} />
        </div>

        {/* Welcome Message for New Users */}
        <div className="mt-8 p-6 rounded-lg bg-gradient-to-r from-blue-400/10 to-purple-400/10 border border-blue-400/20">
          <div className="max-w-3xl">
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Welcome to Your Wellness Journey! 🌟
            </h2>
            <p className="text-muted-foreground mb-4">
              Your dashboard is your command center for building healthy habits.
              Here you can track your daily reminders, monitor your progress,
              and take quick actions to stay on top of your wellness goals.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400 mt-2 flex-shrink-0"></div>
                <div>
                  <span className="font-medium text-foreground">
                    Today's Reminders:
                  </span>
                  <span className="text-muted-foreground ml-1">
                    View and complete your scheduled wellness reminders
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-400 mt-2 flex-shrink-0"></div>
                <div>
                  <span className="font-medium text-foreground">
                    Daily Stats:
                  </span>
                  <span className="text-muted-foreground ml-1">
                    Track your completion rate and progress
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-400 mt-2 flex-shrink-0"></div>
                <div>
                  <span className="font-medium text-foreground">
                    Quick Actions:
                  </span>
                  <span className="text-muted-foreground ml-1">
                    Fast access to create reminders and view analytics
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center py-8 border-t border-border">
          <p className="text-sm text-muted-foreground">
            💡 Tip: Use keyboard shortcuts for faster navigation. Press{" "}
            <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+N</kbd> to
            create a new reminder!
          </p>
        </div>
      </div>
    </div>
  );
}
