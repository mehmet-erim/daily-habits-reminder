"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CompletionChart } from "@/components/charts/CompletionChart";
import { StreakChart } from "@/components/charts/StreakChart";
import { HabitPatternsChart } from "@/components/charts/HabitPatternsChart";
import { GoalProgressChart } from "@/components/charts/GoalProgressChart";
import { AnalyticsData } from "@/lib/analytics";
import {
  BarChart3,
  TrendingUp,
  Calendar,
  Target,
  Loader2,
  RefreshCw,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { format } from "date-fns";

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<string>("30");

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/analytics?days=${timeRange}`);
      if (!response.ok) {
        throw new Error("Failed to fetch analytics data");
      }

      const result = await response.json();
      setAnalyticsData(result.analytics);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading your analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !analyticsData) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Unable to Load Analytics
              </h3>
              <p className="text-muted-foreground mb-4">
                {error || "No analytics data available"}
              </p>
              <Button onClick={fetchAnalytics} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const {
    completionRate,
    streaks,
    habitPatterns,
    goalProgress,
    dailyActivity,
    weeklyComparison,
  } = analyticsData;

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-primary" />
            Analytics Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive insights into your wellness habits and progress
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchAnalytics} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current Streak</p>
                <p className="text-2xl font-bold text-foreground">
                  {streaks.currentStreak} days
                </p>
              </div>
              <div className="h-8 w-8 bg-amber-400/10 rounded-full flex items-center justify-center">
                <Calendar className="h-4 w-4 text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Weekly Progress</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold text-foreground">
                    {weeklyComparison.currentWeek.rate}%
                  </p>
                  {weeklyComparison.improvement > 0 ? (
                    <Badge className="bg-green-400/10 text-green-400">
                      <ArrowUp className="h-3 w-3 mr-1" />+
                      {weeklyComparison.improvement}%
                    </Badge>
                  ) : weeklyComparison.improvement < 0 ? (
                    <Badge className="bg-red-400/10 text-red-400">
                      <ArrowDown className="h-3 w-3 mr-1" />
                      {weeklyComparison.improvement}%
                    </Badge>
                  ) : (
                    <Badge className="bg-muted/10 text-muted-foreground">
                      No change
                    </Badge>
                  )}
                </div>
              </div>
              <div className="h-8 w-8 bg-blue-400/10 rounded-full flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Habits</p>
                <p className="text-2xl font-bold text-foreground">
                  {habitPatterns.length}
                </p>
              </div>
              <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                <Target className="h-4 w-4 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Goals Completed</p>
                <p className="text-2xl font-bold text-foreground">
                  {goalProgress.filter((g) => g.percentage >= 100).length} /{" "}
                  {goalProgress.length}
                </p>
              </div>
              <div className="h-8 w-8 bg-green-400/10 rounded-full flex items-center justify-center">
                <Target className="h-4 w-4 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Comparison Insight */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Weekly Comparison</CardTitle>
          <CardDescription className="text-muted-foreground">
            How you're doing this week compared to last week
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-foreground">This Week</h4>
              <div className="flex items-center justify-between p-3 bg-card/50 rounded-lg border border-border">
                <span className="text-sm text-muted-foreground">Completed</span>
                <span className="text-sm font-medium text-foreground">
                  {weeklyComparison.currentWeek.completed}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-card/50 rounded-lg border border-border">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="text-sm font-medium text-foreground">
                  {weeklyComparison.currentWeek.total}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-card/50 rounded-lg border border-border">
                <span className="text-sm text-muted-foreground">Rate</span>
                <span className="text-sm font-medium text-foreground">
                  {weeklyComparison.currentWeek.rate}%
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-foreground">Last Week</h4>
              <div className="flex items-center justify-between p-3 bg-card/50 rounded-lg border border-border">
                <span className="text-sm text-muted-foreground">Completed</span>
                <span className="text-sm font-medium text-foreground">
                  {weeklyComparison.previousWeek.completed}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-card/50 rounded-lg border border-border">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="text-sm font-medium text-foreground">
                  {weeklyComparison.previousWeek.total}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-card/50 rounded-lg border border-border">
                <span className="text-sm text-muted-foreground">Rate</span>
                <span className="text-sm font-medium text-foreground">
                  {weeklyComparison.previousWeek.rate}%
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Completion Rate Chart */}
        <CompletionChart data={completionRate} className="xl:col-span-2" />

        {/* Streak Chart */}
        <StreakChart data={streaks} />

        {/* Goal Progress Chart */}
        <GoalProgressChart data={goalProgress} />
      </div>

      {/* Habit Patterns Chart */}
      <HabitPatternsChart data={habitPatterns} />

      {/* Footer with Last Updated */}
      <div className="text-center text-sm text-muted-foreground">
        <p>Last updated: {format(new Date(), "PPpp")}</p>
        <p className="mt-1">
          Data refreshes automatically every time you visit this page
        </p>
      </div>
    </div>
  );
}
