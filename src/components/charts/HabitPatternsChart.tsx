"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { HabitPatternData } from "@/lib/analytics";
import { Calendar, Target, TrendingUp, TrendingDown } from "lucide-react";

interface HabitPatternsChartProps {
  data: HabitPatternData[];
  className?: string;
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--green-400))",
  "hsl(var(--blue-400))",
  "hsl(var(--amber-400))",
  "hsl(var(--purple-400))",
  "hsl(var(--pink-400))",
];

export function HabitPatternsChart({
  data,
  className,
}: HabitPatternsChartProps) {
  // Prepare data for the bar chart
  const chartData = data.map((habit, index) => ({
    ...habit,
    color: COLORS[index % COLORS.length],
  }));

  // Custom tooltip for bar chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-sm">
          <p className="text-sm font-medium text-foreground">{label}</p>
          <div className="space-y-1 mt-2">
            <p className="text-sm text-muted-foreground">
              Completion Rate:{" "}
              <span className="text-primary font-medium">
                {data.completionRate}%
              </span>
            </p>
            <p className="text-sm text-muted-foreground">
              Completed:{" "}
              <span className="text-green-400 font-medium">
                {data.completedReminders}
              </span>
            </p>
            <p className="text-sm text-muted-foreground">
              Total:{" "}
              <span className="text-foreground font-medium">
                {data.totalReminders}
              </span>
            </p>
            <p className="text-sm text-muted-foreground">
              Best Day:{" "}
              <span className="text-blue-400 font-medium">{data.bestDay}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Get performance level
  const getPerformanceLevel = (rate: number) => {
    if (rate >= 90)
      return {
        label: "Excellent",
        color: "text-green-400",
        bgColor: "bg-green-400/10",
      };
    if (rate >= 75)
      return {
        label: "Good",
        color: "text-blue-400",
        bgColor: "bg-blue-400/10",
      };
    if (rate >= 50)
      return {
        label: "Average",
        color: "text-amber-400",
        bgColor: "bg-amber-400/10",
      };
    return {
      label: "Needs Work",
      color: "text-red-400",
      bgColor: "bg-red-400/10",
    };
  };

  // Calculate average completion rate
  const averageRate =
    data.length > 0
      ? Math.round(
          data.reduce((acc, habit) => acc + habit.completionRate, 0) /
            data.length
        )
      : 0;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Habit Performance Analysis
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Detailed breakdown of your habits and their completion patterns
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-card/50 rounded-lg border border-border">
            <p className="text-2xl font-bold text-foreground">{averageRate}%</p>
            <p className="text-sm text-muted-foreground">Average Rate</p>
          </div>
          <div className="text-center p-4 bg-card/50 rounded-lg border border-border">
            <p className="text-2xl font-bold text-foreground">{data.length}</p>
            <p className="text-sm text-muted-foreground">Active Habits</p>
          </div>
          <div className="text-center p-4 bg-card/50 rounded-lg border border-border">
            <p className="text-2xl font-bold text-green-400">
              {data.filter((h) => h.completionRate >= 75).length}
            </p>
            <p className="text-sm text-muted-foreground">Performing Well</p>
          </div>
        </div>

        {/* Completion Rate Bar Chart */}
        {data.length > 0 && (
          <div className="mb-8">
            <h4 className="text-sm font-medium text-foreground mb-4">
              Completion Rates by Habit
            </h4>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 60,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                    opacity={0.3}
                  />
                  <XAxis
                    dataKey="title"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="completionRate"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Detailed Habit List */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-foreground">Habit Details</h4>
          {data.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No habit data available yet.</p>
              <p className="text-sm">
                Complete some reminders to see your patterns!
              </p>
            </div>
          ) : (
            data.map((habit) => {
              const performance = getPerformanceLevel(habit.completionRate);
              return (
                <div
                  key={habit.reminderId}
                  className="p-4 border border-border rounded-lg"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h5 className="font-medium text-foreground">
                        {habit.title}
                      </h5>
                      <Badge variant="outline" className="mt-1">
                        {habit.category}
                      </Badge>
                    </div>
                    <Badge
                      className={`${performance.bgColor} ${performance.color}`}
                    >
                      {performance.label}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-muted-foreground">
                          Completion Rate
                        </span>
                        <span className="text-sm font-medium text-foreground">
                          {habit.completionRate}%
                        </span>
                      </div>
                      <Progress value={habit.completionRate} className="h-2" />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">Completed</p>
                        <p className="font-medium text-green-400">
                          {habit.completedReminders}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Total</p>
                        <p className="font-medium text-foreground">
                          {habit.totalReminders}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Best Day</p>
                        <p className="font-medium text-blue-400">
                          {habit.bestDay}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Worst Day</p>
                        <p className="font-medium text-amber-400">
                          {habit.worstDay}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Performance Insights */}
        {data.length > 0 && (
          <div className="mt-6 p-4 bg-card/30 rounded-lg border border-border">
            <h4 className="text-sm font-medium text-foreground mb-2">
              Performance Insights
            </h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              {averageRate >= 80 ? (
                <p className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-400" />
                  Excellent overall performance! You're maintaining great
                  habits.
                </p>
              ) : averageRate >= 60 ? (
                <p className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-400" />
                  Good progress! Focus on your lowest-performing habits for
                  improvement.
                </p>
              ) : (
                <p className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-amber-400" />
                  There's room for improvement. Consider adjusting your routine
                  or reminder times.
                </p>
              )}

              {data.some((h) => h.bestDay !== h.worstDay) && (
                <p>
                  📅 You show different performance patterns on different days
                  of the week.
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
