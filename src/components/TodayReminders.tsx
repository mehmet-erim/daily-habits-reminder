"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Clock,
  CheckCircle2,
  XCircle,
  Timer,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { formatReminderTime } from "@/lib/dashboard-utils";
import { ActionButtonsWithStatus } from "@/components/ActionButtons";
import { SwipeableReminderCard } from "@/components/mobile/SwipeableCard";
import { PullToRefresh } from "@/components/mobile/PullToRefresh";
import { useIsMobile } from "@/hooks/use-mobile";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";

interface ReminderWithStatus {
  id: string;
  title: string;
  description: string | null;
  category: string;
  reminderTime: string;
  status: "pending" | "completed" | "dismissed" | "snoozed";
  snoozeCount: number;
  logs: any[];
}

interface TodayRemindersProps {
  userId: string;
}

export function TodayReminders({ userId }: TodayRemindersProps) {
  const [reminders, setReminders] = useState<ReminderWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isMobile = useIsMobile();
  const haptic = useHapticFeedback();

  const fetchTodayReminders = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/dashboard/today-reminders", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch reminders");
      }

      const data = await response.json();
      setReminders(data.reminders || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayReminders();
  }, [userId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-400" />;
      case "dismissed":
        return <XCircle className="h-4 w-4 text-red-400" />;
      case "snoozed":
        return <Timer className="h-4 w-4 text-yellow-400" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string, snoozeCount: number) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-400/10 text-green-400 border-green-400/20">
            Completed
          </Badge>
        );
      case "dismissed":
        return (
          <Badge className="bg-red-400/10 text-red-400 border-red-400/20">
            Dismissed
          </Badge>
        );
      case "snoozed":
        return (
          <Badge className="bg-yellow-400/10 text-yellow-400 border-yellow-400/20">
            Snoozed {snoozeCount > 1 ? `(${snoozeCount}x)` : ""}
          </Badge>
        );
      default:
        return (
          <Badge className="bg-blue-400/10 text-blue-400 border-blue-400/20">
            Pending
          </Badge>
        );
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      wellness: "text-blue-400",
      health: "text-green-400",
      exercise: "text-orange-400",
      nutrition: "text-purple-400",
      mindfulness: "text-indigo-400",
      default: "text-muted-foreground",
    };
    return colors[category] || colors.default;
  };

  // Handle mobile swipe actions
  const handleSwipeComplete = async (reminderId: string) => {
    haptic.feedback.success();
    // Call the API to mark as completed
    try {
      const response = await fetch("/api/logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reminderId,
          action: "completed",
        }),
      });

      if (response.ok) {
        await fetchTodayReminders();
      }
    } catch (error) {
      console.error("Failed to complete reminder:", error);
      haptic.feedback.error();
    }
  };

  const handleSwipeDismiss = async (reminderId: string) => {
    haptic.feedback.swipeDismiss();
    try {
      const response = await fetch("/api/logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reminderId,
          action: "dismissed",
        }),
      });

      if (response.ok) {
        await fetchTodayReminders();
      }
    } catch (error) {
      console.error("Failed to dismiss reminder:", error);
      haptic.feedback.error();
    }
  };

  const handleSwipeSnooze = async (reminderId: string) => {
    haptic.feedback.swipeSnooze();
    try {
      const response = await fetch("/api/logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reminderId,
          action: "snoozed",
        }),
      });

      if (response.ok) {
        await fetchTodayReminders();
      }
    } catch (error) {
      console.error("Failed to snooze reminder:", error);
      haptic.feedback.error();
    }
  };

  const handleSwipeEdit = (reminderId: string) => {
    haptic.feedback.selection();
    // Navigate to edit page
    window.location.href = `/reminders/${reminderId}/edit`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Today's Reminders
          </CardTitle>
          <CardDescription>Your wellness reminders for today</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 text-red-400" />
            Error Loading Reminders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchTodayReminders} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  const content = (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Clock className="h-5 w-5 flex-shrink-0" />
              <span className="truncate">Today's Reminders</span>
            </CardTitle>
            <CardDescription className="text-sm">
              Your wellness reminders for today
              {isMobile ? " - Swipe cards to interact" : ""}
            </CardDescription>
          </div>
          <Button
            onClick={fetchTodayReminders}
            variant="outline"
            size="sm"
            className="w-full sm:w-auto flex-shrink-0"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {reminders.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">
              No reminders scheduled for today
            </p>
            <p className="text-sm text-muted-foreground">
              Your upcoming reminders will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reminders.map((reminder, index) => {
              const reminderContent = (
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {getStatusIcon(reminder.status)}
                        <h4 className="font-medium text-foreground break-words flex-1 min-w-0">
                          {reminder.title}
                        </h4>
                        {getStatusBadge(reminder.status, reminder.snoozeCount)}
                      </div>

                      {reminder.description && (
                        <p className="text-sm text-muted-foreground mb-2 break-words">
                          {reminder.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3 flex-shrink-0" />
                          <span className="break-words">
                            {formatReminderTime(reminder.reminderTime)}
                          </span>
                        </span>
                        <span
                          className={`${getCategoryColor(
                            reminder.category
                          )} capitalize`}
                        >
                          {reminder.category}
                        </span>
                      </div>
                    </div>

                    {!isMobile && (
                      <div className="flex-shrink-0">
                        <ActionButtonsWithStatus
                          reminderId={reminder.id}
                          status={reminder.status}
                          currentSnoozeCount={reminder.snoozeCount}
                          onActionComplete={() => fetchTodayReminders()}
                        />
                      </div>
                    )}
                  </div>

                  {/* Mobile Action Buttons */}
                  {isMobile && reminder.status === "pending" && (
                    <div className="pt-2 border-t border-border">
                      <ActionButtonsWithStatus
                        reminderId={reminder.id}
                        status={reminder.status}
                        currentSnoozeCount={reminder.snoozeCount}
                        onActionComplete={() => fetchTodayReminders()}
                        className="justify-center"
                      />
                    </div>
                  )}
                </div>
              );

              return (
                <div key={reminder.id}>
                  {isMobile && reminder.status === "pending" ? (
                    <SwipeableReminderCard
                      reminderId={reminder.id}
                      onComplete={handleSwipeComplete}
                      onDismiss={handleSwipeDismiss}
                      onSnooze={handleSwipeSnooze}
                      onEdit={handleSwipeEdit}
                      className="mb-4"
                    >
                      {reminderContent}
                    </SwipeableReminderCard>
                  ) : (
                    <div className="p-4 rounded-lg border border-border bg-card/50">
                      {reminderContent}
                    </div>
                  )}

                  {index < reminders.length - 1 && (
                    <Separator className="my-4" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Wrap with pull-to-refresh on mobile
  if (isMobile) {
    return (
      <PullToRefresh
        onRefresh={fetchTodayReminders}
        disabled={loading}
        className="h-full"
      >
        {content}
      </PullToRefresh>
    );
  }

  return content;
}
