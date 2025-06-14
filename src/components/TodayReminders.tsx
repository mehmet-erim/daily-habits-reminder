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

  const handleAction = async (reminderId: string, action: string) => {
    try {
      const response = await fetch("/api/logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reminderId,
          action,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} reminder`);
      }

      // Refresh the reminders list
      await fetchTodayReminders();
    } catch (err) {
      console.error(`Error ${action} reminder:`, err);
    }
  };

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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Today's Reminders
          </div>
          <Button onClick={fetchTodayReminders} variant="ghost" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardTitle>
        <CardDescription>Your wellness reminders for today</CardDescription>
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
            {reminders.map((reminder, index) => (
              <div key={reminder.id}>
                <div className="flex items-start justify-between p-4 rounded-lg border border-border bg-card/50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(reminder.status)}
                      <h4 className="font-medium text-foreground">
                        {reminder.title}
                      </h4>
                      {getStatusBadge(reminder.status, reminder.snoozeCount)}
                    </div>

                    {reminder.description && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {reminder.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatReminderTime(reminder.reminderTime)}
                      </span>
                      <span className={getCategoryColor(reminder.category)}>
                        {reminder.category}
                      </span>
                    </div>
                  </div>

                  {reminder.status === "pending" && (
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        onClick={() => handleAction(reminder.id, "completed")}
                        className="bg-green-400/10 text-green-400 hover:bg-green-400/20 border-green-400/20"
                        variant="outline"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Done
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAction(reminder.id, "dismissed")}
                        className="bg-red-400/10 text-red-400 hover:bg-red-400/20 border-red-400/20"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Skip
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAction(reminder.id, "snoozed")}
                        className="bg-yellow-400/10 text-yellow-400 hover:bg-yellow-400/20 border-yellow-400/20"
                      >
                        <Timer className="h-4 w-4 mr-1" />
                        Snooze
                      </Button>
                    </div>
                  )}
                </div>

                {index < reminders.length - 1 && <Separator className="my-4" />}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
