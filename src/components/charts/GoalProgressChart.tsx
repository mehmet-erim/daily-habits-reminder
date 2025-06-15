"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { GoalProgressData } from "@/lib/analytics";
import { Target, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface GoalProgressChartProps {
  data: GoalProgressData[];
  className?: string;
}

export function GoalProgressChart({ data, className }: GoalProgressChartProps) {
  // Prepare pie chart data
  const pieData = data.map((goal, index) => ({
    name: goal.name,
    value: goal.percentage,
    current: goal.current,
    target: goal.goal,
    color:
      goal.percentage >= 100
        ? "#10b981"
        : goal.percentage >= 75
        ? "#3b82f6"
        : goal.percentage >= 50
        ? "#f59e0b"
        : "#ef4444",
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-sm">
          <p className="text-sm font-medium text-foreground">{data.name}</p>
          <p className="text-sm text-muted-foreground mt-1">
            Progress:{" "}
            <span className="font-medium">
              {data.current} / {data.target}
            </span>
          </p>
          <p className="text-sm text-muted-foreground">
            Completion: <span className="font-medium">{data.value}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Get trend icon
  const getTrendIcon = (trend: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-400" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-400" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  // Get completion status
  const getCompletionStatus = (percentage: number) => {
    if (percentage >= 100)
      return {
        label: "Completed",
        color: "text-green-400",
        bgColor: "bg-green-400/10",
      };
    if (percentage >= 75)
      return {
        label: "Nearly There",
        color: "text-blue-400",
        bgColor: "bg-blue-400/10",
      };
    if (percentage >= 50)
      return {
        label: "In Progress",
        color: "text-amber-400",
        bgColor: "bg-amber-400/10",
      };
    if (percentage >= 25)
      return {
        label: "Getting Started",
        color: "text-orange-400",
        bgColor: "bg-orange-400/10",
      };
    return {
      label: "Just Started",
      color: "text-muted-foreground",
      bgColor: "bg-muted/10",
    };
  };

  const completedGoals = data.filter((goal) => goal.percentage >= 100).length;
  const inProgressGoals = data.filter(
    (goal) => goal.percentage > 0 && goal.percentage < 100
  ).length;
  const averageProgress =
    data.length > 0
      ? Math.round(
          data.reduce((acc, goal) => acc + goal.percentage, 0) / data.length
        )
      : 0;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Daily Goal Progress
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Track your daily goals and achievements
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No goals set yet.</p>
            <p className="text-sm">
              Set daily goals for your counters to track progress!
            </p>
          </div>
        ) : (
          <>
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-card/50 rounded-lg border border-border">
                <p className="text-2xl font-bold text-green-400">
                  {completedGoals}
                </p>
                <p className="text-sm text-muted-foreground">Completed Today</p>
              </div>
              <div className="text-center p-4 bg-card/50 rounded-lg border border-border">
                <p className="text-2xl font-bold text-blue-400">
                  {inProgressGoals}
                </p>
                <p className="text-sm text-muted-foreground">In Progress</p>
              </div>
              <div className="text-center p-4 bg-card/50 rounded-lg border border-border">
                <p className="text-2xl font-bold text-foreground">
                  {averageProgress}%
                </p>
                <p className="text-sm text-muted-foreground">
                  Average Progress
                </p>
              </div>
            </div>

            {/* Pie Chart */}
            {pieData.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-foreground mb-4">
                  Goal Completion Overview
                </h4>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Detailed Goal List */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-foreground">
                Goal Details
              </h4>
              {data.map((goal) => {
                const status = getCompletionStatus(goal.percentage);
                return (
                  <div
                    key={goal.name}
                    className="p-4 border border-border rounded-lg"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div>
                          <h5 className="font-medium text-foreground">
                            {goal.name}
                          </h5>
                          <p className="text-sm text-muted-foreground">
                            {goal.current} / {goal.goal} completed
                          </p>
                        </div>
                        {getTrendIcon(goal.trend)}
                      </div>
                      <Badge className={`${status.bgColor} ${status.color}`}>
                        {status.label}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          Progress
                        </span>
                        <span className="text-sm font-medium text-foreground">
                          {goal.percentage}%
                        </span>
                      </div>
                      <Progress value={goal.percentage} className="h-2" />

                      {goal.daysToGoal && goal.percentage < 100 && (
                        <p className="text-xs text-muted-foreground">
                          At current pace: ~{goal.daysToGoal} days to complete
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Goal Insights */}
            <div className="mt-6 p-4 bg-card/30 rounded-lg border border-border">
              <h4 className="text-sm font-medium text-foreground mb-2">
                Goal Insights
              </h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                {completedGoals === data.length ? (
                  <p>
                    🎉 Congratulations! You've completed all your goals today!
                  </p>
                ) : completedGoals > 0 ? (
                  <p>
                    🎯 Great job completing {completedGoals} out of{" "}
                    {data.length} goals today!
                  </p>
                ) : averageProgress > 50 ? (
                  <p>
                    📈 You're making good progress! Keep going to reach your
                    goals.
                  </p>
                ) : (
                  <p>
                    💪 You're getting started! Small steps lead to big
                    achievements.
                  </p>
                )}

                {data.some((g) => g.trend === "up") && (
                  <p>
                    📊 Some goals are trending upward - you're building
                    momentum!
                  </p>
                )}

                {data.some((g) => g.trend === "down") && (
                  <p>
                    ⚠️ Some goals are trending downward - consider adjusting
                    your targets or routine.
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
