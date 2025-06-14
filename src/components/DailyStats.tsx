"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Timer,
  AlertCircle,
  RefreshCw,
  Target,
} from "lucide-react";

interface DailyStatsData {
  totalScheduled: number;
  completed: number;
  dismissed: number;
  snoozed: number;
  missed: number;
  completionRate: number;
}

interface DailyStatsProps {
  userId: string;
}

export function DailyStats({ userId }: DailyStatsProps) {
  const [stats, setStats] = useState<DailyStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDailyStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/dashboard/daily-stats", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch daily stats");
      }

      const data = await response.json();
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDailyStats();
  }, [userId]);

  const getCompletionRateColor = (rate: number) => {
    if (rate >= 80) return "text-green-400";
    if (rate >= 60) return "text-yellow-400";
    if (rate >= 40) return "text-orange-400";
    return "text-red-400";
  };

  const getCompletionRateText = (rate: number) => {
    if (rate >= 90) return "Excellent!";
    if (rate >= 75) return "Great job!";
    if (rate >= 50) return "Good progress";
    if (rate >= 25) return "Keep going";
    return "Let's improve";
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Daily Statistics
          </CardTitle>
          <CardDescription>Your daily completion statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="animate-pulse">
              <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
              <div className="h-2 bg-muted rounded w-full mb-4"></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-8 bg-muted rounded mb-1"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              ))}
            </div>
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
            Error Loading Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchDailyStats} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Daily Statistics
          </div>
          <Button onClick={fetchDailyStats} variant="ghost" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardTitle>
        <CardDescription>Your completion statistics for today</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Overall Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-lg font-bold ${getCompletionRateColor(
                  stats.completionRate
                )}`}
              >
                {stats.completionRate}%
              </span>
              <TrendingUp
                className={`h-4 w-4 ${getCompletionRateColor(
                  stats.completionRate
                )}`}
              />
            </div>
          </div>
          <Progress value={stats.completionRate} className="h-2" />
          <p
            className={`text-xs ${getCompletionRateColor(
              stats.completionRate
            )}`}
          >
            {getCompletionRateText(stats.completionRate)}
          </p>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 rounded-lg bg-green-400/10 border border-green-400/20">
            <div className="flex items-center justify-center mb-1">
              <CheckCircle2 className="h-5 w-5 text-green-400 mr-1" />
              <span className="text-2xl font-bold text-green-400">
                {stats.completed}
              </span>
            </div>
            <p className="text-xs text-green-400">Completed</p>
          </div>

          <div className="text-center p-3 rounded-lg bg-red-400/10 border border-red-400/20">
            <div className="flex items-center justify-center mb-1">
              <XCircle className="h-5 w-5 text-red-400 mr-1" />
              <span className="text-2xl font-bold text-red-400">
                {stats.dismissed}
              </span>
            </div>
            <p className="text-xs text-red-400">Dismissed</p>
          </div>

          <div className="text-center p-3 rounded-lg bg-yellow-400/10 border border-yellow-400/20">
            <div className="flex items-center justify-center mb-1">
              <Timer className="h-5 w-5 text-yellow-400 mr-1" />
              <span className="text-2xl font-bold text-yellow-400">
                {stats.snoozed}
              </span>
            </div>
            <p className="text-xs text-yellow-400">Snoozed</p>
          </div>

          <div className="text-center p-3 rounded-lg bg-gray-400/10 border border-gray-400/20">
            <div className="flex items-center justify-center mb-1">
              <AlertCircle className="h-5 w-5 text-gray-400 mr-1" />
              <span className="text-2xl font-bold text-gray-400">
                {stats.missed}
              </span>
            </div>
            <p className="text-xs text-gray-400">Missed</p>
          </div>
        </div>

        {/* Summary */}
        <div className="pt-4 border-t border-border">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total Scheduled:</span>
            <span className="font-medium text-foreground">
              {stats.totalScheduled}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-muted-foreground">Completion Rate:</span>
            <span
              className={`font-medium ${getCompletionRateColor(
                stats.completionRate
              )}`}
            >
              {stats.completionRate}%
            </span>
          </div>
        </div>

        {/* Motivational Message */}
        {stats.totalScheduled > 0 && (
          <div className="text-center py-2">
            {stats.completionRate === 100 ? (
              <p className="text-sm text-green-400 font-medium">
                🎉 Perfect day! All reminders completed!
              </p>
            ) : stats.completed > 0 ? (
              <p className="text-sm text-muted-foreground">
                You've completed {stats.completed} out of {stats.totalScheduled}{" "}
                reminders today
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Ready to start your wellness journey today?
              </p>
            )}
          </div>
        )}

        {/* Empty State */}
        {stats.totalScheduled === 0 && (
          <div className="text-center py-8">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">
              No reminders scheduled for today
            </p>
            <p className="text-sm text-muted-foreground">
              Set up some reminders to track your progress
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
