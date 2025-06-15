"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { StreakData } from "@/lib/analytics";
import { TrendingUp, Flame } from "lucide-react";

interface StreakChartProps {
  data: StreakData;
  className?: string;
}

export function StreakChart({ data, className }: StreakChartProps) {
  // Transform streak history for the chart (show last 30 days)
  const recentHistory = data.streakHistory.slice(-30);
  const chartData = recentHistory.map((item) => ({
    ...item,
    displayDate: format(parseISO(item.date), "MMM dd"),
  }));

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const streakValue = payload[0].value;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-sm">
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-sm text-muted-foreground mt-1">
            Streak:{" "}
            <span className="text-amber-400 font-medium">
              {streakValue} days
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Calculate streak quality
  const getStreakQuality = (streak: number) => {
    if (streak >= 30) return { label: "Legendary", color: "text-purple-400" };
    if (streak >= 21) return { label: "Amazing", color: "text-yellow-400" };
    if (streak >= 14) return { label: "Great", color: "text-green-400" };
    if (streak >= 7) return { label: "Good", color: "text-blue-400" };
    if (streak >= 3) return { label: "Building", color: "text-orange-400" };
    return { label: "Starting", color: "text-muted-foreground" };
  };

  const currentQuality = getStreakQuality(data.currentStreak);
  const longestQuality = getStreakQuality(data.longestStreak);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <Flame className="h-5 w-5 text-amber-400" />
          Streak Progress
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Your consistency streak over time
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Current Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center p-4 bg-card/50 rounded-lg border border-border">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Flame className="h-5 w-5 text-amber-400" />
              <span className="text-sm text-muted-foreground">
                Current Streak
              </span>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {data.currentStreak}
            </p>
            <Badge
              variant="secondary"
              className={`mt-1 ${currentQuality.color}`}
            >
              {currentQuality.label}
            </Badge>
          </div>

          <div className="text-center p-4 bg-card/50 rounded-lg border border-border">
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-green-400" />
              <span className="text-sm text-muted-foreground">Best Streak</span>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {data.longestStreak}
            </p>
            <Badge
              variant="secondary"
              className={`mt-1 ${longestQuality.color}`}
            >
              {longestQuality.label}
            </Badge>
          </div>
        </div>

        {/* Streak Chart */}
        {chartData.length > 0 && (
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 20,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  opacity={0.3}
                />
                <XAxis
                  dataKey="displayDate"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="streak"
                  stroke="hsl(var(--amber-400))"
                  fill="hsl(var(--amber-400))"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Streak Insights */}
        <div className="mt-6 p-4 bg-card/30 rounded-lg border border-border">
          <h4 className="text-sm font-medium text-foreground mb-2">
            Streak Insights
          </h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            {data.currentStreak === 0 ? (
              <p>💪 Start building your streak today!</p>
            ) : data.currentStreak === data.longestStreak ? (
              <p>🔥 You're on your best streak ever! Keep it going!</p>
            ) : data.currentStreak >= data.longestStreak * 0.8 ? (
              <p>⭐ You're close to beating your best streak!</p>
            ) : (
              <p>
                📈 Great progress! Your longest streak was {data.longestStreak}{" "}
                days.
              </p>
            )}

            {data.currentStreak >= 7 && (
              <p>
                🎯 You've completed at least one full week - excellent
                consistency!
              </p>
            )}

            {data.currentStreak >= 21 && (
              <p>🏆 3 weeks in a row! This is becoming a solid habit.</p>
            )}

            {data.currentStreak >= 30 && (
              <p>
                👑 30+ days! You're in the top tier of consistent performers!
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
