"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

// Import Lucide icons that might be commonly used for counters
import {
  Droplets,
  Coffee,
  Footprints,
  Clock,
  BookOpen,
  Dumbbell,
  Heart,
  Pill,
  Apple,
  Moon,
  Target,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";

// Icon mapping for common counter types
const iconMap = {
  droplets: Droplets,
  coffee: Coffee,
  footprints: Footprints,
  clock: Clock,
  book: BookOpen,
  dumbbell: Dumbbell,
  heart: Heart,
  pill: Pill,
  apple: Apple,
  moon: Moon,
  target: Target,
  activity: Activity,
  "trending-up": TrendingUp,
  "trending-down": TrendingDown,
  minus: Minus,
};

export interface CounterData {
  id: string;
  name: string;
  unit: string;
  iconName?: string;
  color: string;
  dailyGoal?: number;
  currentValue: number;
  isActive: boolean;
  date: string;
  reminder?: {
    id: string;
    title: string;
    category: string;
  };
}

interface CounterDisplayProps {
  counter: CounterData;
  showProgress?: boolean;
  showGoal?: boolean;
  compact?: boolean;
  className?: string;
}

export const CounterDisplay: React.FC<CounterDisplayProps> = ({
  counter,
  showProgress = true,
  showGoal = true,
  compact = false,
  className,
}) => {
  const { name, unit, iconName, color, dailyGoal, currentValue, reminder } =
    counter;

  // Get the icon component
  const IconComponent = iconName
    ? iconMap[iconName as keyof typeof iconMap]
    : Target;

  // Calculate progress percentage
  const progressPercentage = dailyGoal
    ? Math.min((currentValue / dailyGoal) * 100, 100)
    : 0;

  // Determine if goal is reached
  const goalReached = dailyGoal ? currentValue >= dailyGoal : false;

  // Format the display value
  const formatValue = (value: number, unit: string) => {
    if (unit === "count") {
      return value.toString();
    }
    return `${value} ${unit}`;
  };

  if (compact) {
    return (
      <div
        className={cn(
          "flex items-center gap-3 p-3 rounded-lg border border-border bg-card",
          className
        )}
      >
        <div
          className="flex items-center justify-center w-8 h-8 rounded-full"
          style={{ backgroundColor: `${color}20`, color: color }}
        >
          {IconComponent && <IconComponent className="w-4 h-4" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground truncate">
              {name}
            </p>
            <p className="text-sm font-semibold text-foreground">
              {formatValue(currentValue, unit)}
            </p>
          </div>

          {dailyGoal && showProgress && (
            <div className="mt-1">
              <Progress
                value={progressPercentage}
                className="h-1"
                style={
                  {
                    color: color,
                    "--progress-foreground": color,
                  } as React.CSSProperties
                }
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card className={cn("p-4", className)}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-10 h-10 rounded-full"
            style={{ backgroundColor: `${color}20`, color: color }}
          >
            {IconComponent && <IconComponent className="w-5 h-5" />}
          </div>

          <div>
            <h3 className="text-base font-semibold text-foreground">{name}</h3>
            {reminder && (
              <p className="text-xs text-muted-foreground">
                Linked to: {reminder.title}
              </p>
            )}
          </div>
        </div>

        {goalReached && (
          <Badge
            variant="secondary"
            className="bg-green-400/10 text-green-400 border-green-400/20"
          >
            Goal reached!
          </Badge>
        )}
      </div>

      <div className="space-y-3">
        {/* Current Value Display */}
        <div className="flex items-end justify-between">
          <div>
            <p
              className="text-2xl font-bold text-foreground"
              style={{ color: color }}
            >
              {formatValue(currentValue, unit)}
            </p>
            {dailyGoal && showGoal && (
              <p className="text-sm text-muted-foreground">
                of {formatValue(dailyGoal, unit)} goal
              </p>
            )}
          </div>

          {dailyGoal && (
            <p className="text-sm font-medium text-muted-foreground">
              {Math.round(progressPercentage)}%
            </p>
          )}
        </div>

        {/* Progress Bar */}
        {dailyGoal && showProgress && (
          <div className="space-y-1">
            <Progress
              value={progressPercentage}
              className="h-2"
              style={
                {
                  color: color,
                  "--progress-foreground": color,
                } as React.CSSProperties
              }
            />

            {progressPercentage > 100 && (
              <p className="text-xs text-muted-foreground">
                {Math.round(progressPercentage - 100)}% over goal
              </p>
            )}
          </div>
        )}

        {/* Additional Info */}
        {!dailyGoal && (
          <p className="text-xs text-muted-foreground">No daily goal set</p>
        )}
      </div>
    </Card>
  );
};

export default CounterDisplay;
