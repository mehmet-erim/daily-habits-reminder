"use client";

import { useState, useEffect } from "react";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  History,
  Calendar as CalendarIcon,
  TrendingUp,
  Download,
  Flame,
  Trophy,
  Target,
  ChevronRight,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

import { Calendar } from "@/components/Calendar";
import { DailyHistory } from "@/components/DailyHistory";
import { DataExport } from "@/components/DataExport";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import {
  HistoricalDayData,
  StreakData,
  getHistoricalDataForDate,
  calculateCompletionStreak,
  getWeeklyComparison,
  getMonthlyTrends,
} from "@/lib/data-utils";
import { cn } from "@/lib/utils";

interface ChartData {
  date: string;
  completionRate: number;
  completed: number;
  totalScheduled: number;
}

export default function HistoryPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );
  const [dailyData, setDailyData] = useState<HistoricalDayData | null>(null);
  const [streakData, setStreakData] = useState<StreakData | undefined>(
    undefined
  );
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [completionData, setCompletionData] = useState<
    Array<{
      date: string;
      completionRate: number;
      totalScheduled: number;
      completed: number;
    }>
  >([]);
  const [availableDateRange, setAvailableDateRange] = useState<
    | {
        startDate: string | null;
        endDate: string | null;
        totalDays: number;
      }
    | undefined
  >(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [chartPeriod, setChartPeriod] = useState<"week" | "month">("week");

  // Mock user ID - in a real app, this would come from authentication context
  const userId = "user1"; // This should be replaced with actual user ID from auth context

  useEffect(() => {
    loadAvailableDateRange();
    loadCompletionData();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      loadDailyData(selectedDate);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadStreakData();
  }, []);

  const loadAvailableDateRange = async () => {
    try {
      const response = await fetch("/api/history/available-range");
      if (response.ok) {
        const range = await response.json();
        setAvailableDateRange(range);
      }
    } catch (error) {
      console.error("Failed to load available date range:", error);
    }
  };

  const loadCompletionData = async () => {
    try {
      setIsLoading(true);
      const endDate = format(new Date(), "yyyy-MM-dd");
      const startDate = format(subDays(new Date(), 90), "yyyy-MM-dd"); // Last 3 months

      const response = await fetch(
        `/api/history/range?startDate=${startDate}&endDate=${endDate}`
      );
      if (response.ok) {
        const data: HistoricalDayData[] = await response.json();

        // Transform data for calendar and charts
        const completionData = data.map((day) => ({
          date: day.date,
          completionRate: day.completionRate,
          totalScheduled: day.totalScheduled,
          completed: day.completed,
        }));

        setCompletionData(completionData);

        // Prepare chart data (last 30 days)
        const recentData = data.slice(-30).map((day) => ({
          date: format(new Date(day.date), "MMM d"),
          completionRate: day.completionRate,
          completed: day.completed,
          totalScheduled: day.totalScheduled,
        }));

        setChartData(recentData);
      }
    } catch (error) {
      console.error("Failed to load completion data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDailyData = async (date: Date) => {
    try {
      const dateString = format(date, "yyyy-MM-dd");
      const data = await getHistoricalDataForDate(userId, dateString);
      setDailyData(data);
    } catch (error) {
      console.error("Failed to load daily data:", error);
      setDailyData(null);
    }
  };

  const loadStreakData = async () => {
    try {
      const streak = await calculateCompletionStreak(userId);
      setStreakData(streak);
    } catch (error) {
      console.error("Failed to load streak data:", error);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
  };

  // Calculate some quick stats
  const recentStats = chartData.slice(-7); // Last 7 days
  const averageCompletionRate =
    recentStats.length > 0
      ? recentStats.reduce((sum, day) => sum + day.completionRate, 0) /
        recentStats.length
      : 0;
  const totalCompletedThisWeek = recentStats.reduce(
    (sum, day) => sum + day.completed,
    0
  );

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background p-4">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                History & Analytics
              </h1>
              <p className="text-muted-foreground">
                Review your wellness journey and track your progress over time
              </p>
            </div>

            {streakData && (
              <Card className="px-4 py-2">
                <div className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-orange-400" />
                  <div>
                    <p className="text-lg font-bold text-foreground">
                      {streakData.currentStreak}
                    </p>
                    <p className="text-xs text-muted-foreground">day streak</p>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  This Week Average
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {averageCompletionRate.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">completion rate</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Week Completed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {totalCompletedThisWeek}
                </div>
                <p className="text-xs text-muted-foreground">reminders</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Best Streak
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {streakData?.longestStreak || 0}
                </div>
                <p className="text-xs text-muted-foreground">days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {availableDateRange?.totalDays || 0}
                </div>
                <p className="text-xs text-muted-foreground">days tracked</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Left Column - Calendar and Daily View */}
            <div className="xl:col-span-2 space-y-6">
              {/* Calendar */}
              <Calendar
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
                completionData={completionData}
                minDate={
                  availableDateRange?.startDate
                    ? new Date(availableDateRange.startDate)
                    : undefined
                }
                maxDate={
                  availableDateRange?.endDate
                    ? new Date(availableDateRange.endDate)
                    : undefined
                }
              />

              {/* Charts */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-muted-foreground" />
                        Completion Trends
                      </CardTitle>
                      <CardDescription className="text-sm text-muted-foreground">
                        Your completion rate over time
                      </CardDescription>
                    </div>

                    <Select
                      value={chartPeriod}
                      onValueChange={(value: "week" | "month") =>
                        setChartPeriod(value)
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="week">Last Week</SelectItem>
                        <SelectItem value="month">Last Month</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  {chartData.length > 0 ? (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={chartData.slice(
                            chartPeriod === "week" ? -7 : -30
                          )}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="rgb(148 163 184 / 0.1)"
                          />
                          <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "rgb(148 163 184)", fontSize: 12 }}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "rgb(148 163 184)", fontSize: 12 }}
                            domain={[0, 100]}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "rgb(15 23 42)",
                              border: "1px solid rgb(51 65 85)",
                              borderRadius: "8px",
                              color: "rgb(241 245 249)",
                            }}
                            formatter={(value: number) => [
                              `${value.toFixed(1)}%`,
                              "Completion Rate",
                            ]}
                          />
                          <Line
                            type="monotone"
                            dataKey="completionRate"
                            stroke="rgb(34 197 94)"
                            strokeWidth={2}
                            dot={{ fill: "rgb(34 197 94)", strokeWidth: 2 }}
                            activeDot={{ r: 4, fill: "rgb(34 197 94)" }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-muted-foreground">
                      No data available for chart
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Daily Details and Export */}
            <div className="space-y-6">
              {/* Daily History */}
              <DailyHistory
                data={dailyData}
                streak={streakData}
                isLoading={isLoading}
              />

              {/* Data Export */}
              <DataExport
                userId={userId}
                availableDateRange={availableDateRange}
              />
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
