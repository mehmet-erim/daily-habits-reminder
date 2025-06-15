"use client";

import {
  LineChart,
  Line,
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
import { format, parseISO } from "date-fns";
import { CompletionRateData } from "@/lib/analytics";

interface CompletionChartProps {
  data: CompletionRateData[];
  className?: string;
}

export function CompletionChart({ data, className }: CompletionChartProps) {
  // Transform data for the chart
  const chartData = data.map((item) => ({
    ...item,
    displayDate: format(parseISO(item.date), "MMM dd"),
  }));

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-sm">
          <p className="text-sm font-medium text-foreground">{label}</p>
          <div className="space-y-1 mt-2">
            <p className="text-sm text-muted-foreground">
              Completed:{" "}
              <span className="text-green-400 font-medium">
                {data.completed}
              </span>
            </p>
            <p className="text-sm text-muted-foreground">
              Total:{" "}
              <span className="text-foreground font-medium">{data.total}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Rate:{" "}
              <span className="text-primary font-medium">{data.rate}%</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-foreground">
          Completion Rate Over Time
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Your reminder completion rate for the past {data.length} days
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
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
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="rate"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{
                  fill: "hsl(var(--primary))",
                  strokeWidth: 2,
                  r: 4,
                }}
                activeDot={{
                  r: 6,
                  fill: "hsl(var(--primary))",
                  stroke: "hsl(var(--background))",
                  strokeWidth: 2,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Stats */}
        <div className="flex justify-between items-center mt-4 pt-4 border-t border-border">
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">
              {Math.round(
                data.reduce((acc, item) => acc + item.rate, 0) / data.length
              )}
              %
            </p>
            <p className="text-xs text-muted-foreground">Average Rate</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-400">
              {data.reduce((acc, item) => acc + item.completed, 0)}
            </p>
            <p className="text-xs text-muted-foreground">Total Completed</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">
              {data.reduce((acc, item) => acc + item.total, 0)}
            </p>
            <p className="text-xs text-muted-foreground">Total Reminders</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
