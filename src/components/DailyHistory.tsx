"use client";

import { format, parseISO } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Target,
  Trophy,
  Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { HistoricalDayData, StreakData } from "@/lib/data-utils";

interface DailyHistoryProps {
  data: HistoricalDayData | null;
  streak?: StreakData;
  isLoading?: boolean;
  className?: string;
}

export function DailyHistory({
  data,
  streak,
  isLoading = false,
  className,
}: DailyHistoryProps) {
  if (isLoading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <div className="animate-pulse">
            <div className="h-6 bg-muted rounded mb-2"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-muted rounded"></div>
            <div className="h-16 bg-muted rounded"></div>
            <div className="h-24 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            Daily History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Select a date to view history
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const completionRate = data.completionRate;
  const hasReminders = data.totalScheduled > 0;

  const getCompletionColor = (rate: number) => {
    if (rate >= 90) return "text-green-400";
    if (rate >= 70) return "text-blue-400";
    if (rate >= 50) return "text-amber-400";
    return "text-red-400";
  };

  const getCompletionLabel = (rate: number) => {
    if (rate >= 90) return "Excellent";
    if (rate >= 70) return "Good";
    if (rate >= 50) return "Fair";
    return "Needs Improvement";
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              {format(parseISO(data.date), "EEEE, MMMM d, yyyy")}
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              {data.dayName} • Daily wellness summary
            </CardDescription>
          </div>

          {streak && (
            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className="flex items-center gap-1">
                  <Flame className="h-4 w-4 text-orange-400" />
                  <span className="text-sm font-medium text-foreground">
                    {streak.currentStreak}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">day streak</p>
              </div>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Overall Completion */}
        {hasReminders ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-foreground">
                Overall Completion
              </h3>
              <Badge
                variant="outline"
                className={cn(
                  "font-medium",
                  completionRate >= 70
                    ? "bg-green-400/10 text-green-400 border-green-400/20"
                    : completionRate >= 50
                    ? "bg-amber-400/10 text-amber-400 border-amber-400/20"
                    : "bg-red-400/10 text-red-400 border-red-400/20"
                )}
              >
                {getCompletionLabel(completionRate)}
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span
                  className={cn(
                    "font-medium",
                    getCompletionColor(completionRate)
                  )}
                >
                  {completionRate.toFixed(1)}%
                </span>
              </div>
              <Progress value={completionRate} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {data.completed} of {data.totalScheduled} reminders completed
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No reminders scheduled for this day</p>
          </div>
        )}

        <Separator />

        {/* Reminder Statistics */}
        {hasReminders && (
          <div className="space-y-3">
            <h3 className="font-medium text-foreground">Reminder Actions</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-green-400/5 border border-green-400/10 rounded-lg">
                <div className="p-1.5 bg-green-400/10 rounded-full">
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {data.completed}
                  </p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-red-400/5 border border-red-400/10 rounded-lg">
                <div className="p-1.5 bg-red-400/10 rounded-full">
                  <XCircle className="h-4 w-4 text-red-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {data.dismissed}
                  </p>
                  <p className="text-xs text-muted-foreground">Dismissed</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-amber-400/5 border border-amber-400/10 rounded-lg">
                <div className="p-1.5 bg-amber-400/10 rounded-full">
                  <Clock className="h-4 w-4 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {data.snoozed}
                  </p>
                  <p className="text-xs text-muted-foreground">Snoozed</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted-foreground/5 border border-border rounded-lg">
                <div className="p-1.5 bg-muted-foreground/10 rounded-full">
                  <Target className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {data.missed}
                  </p>
                  <p className="text-xs text-muted-foreground">Missed</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Counters */}
        {data.counters && data.counters.length > 0 && (
          <>
            <Separator />

            <div className="space-y-3">
              <h3 className="font-medium text-foreground">Daily Counters</h3>

              <div className="space-y-3">
                {data.counters.map((counter) => (
                  <div
                    key={counter.id}
                    className="flex items-center justify-between p-3 bg-card border border-border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: counter.color }}
                      />
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {counter.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {counter.currentValue}{" "}
                          {counter.unit !== "count" ? counter.unit : "times"}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      {counter.dailyGoal && (
                        <>
                          <div className="flex items-center gap-1">
                            {counter.goalMet ? (
                              <Trophy className="h-3 w-3 text-green-400" />
                            ) : (
                              <Target className="h-3 w-3 text-muted-foreground" />
                            )}
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs",
                                counter.goalMet
                                  ? "bg-green-400/10 text-green-400 border-green-400/20"
                                  : "bg-muted-foreground/10 text-muted-foreground border-border"
                              )}
                            >
                              {counter.goalMet ? "Goal Met" : "In Progress"}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Goal: {counter.dailyGoal}{" "}
                            {counter.unit !== "count" ? counter.unit : ""}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Streak Information */}
        {streak && (
          <>
            <Separator />

            <div className="space-y-3">
              <h3 className="font-medium text-foreground">
                Streak Information
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-orange-400/5 border border-orange-400/10 rounded-lg">
                  <div className="flex items-center justify-center gap-1 mb-2">
                    <Flame className="h-5 w-5 text-orange-400" />
                    <span className="text-2xl font-bold text-foreground">
                      {streak.currentStreak}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Current Streak
                  </p>
                </div>

                <div className="text-center p-4 bg-amber-400/5 border border-amber-400/10 rounded-lg">
                  <div className="flex items-center justify-center gap-1 mb-2">
                    <Trophy className="h-5 w-5 text-amber-400" />
                    <span className="text-2xl font-bold text-foreground">
                      {streak.longestStreak}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">Best Streak</p>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
