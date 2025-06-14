"use client";

import { useState } from "react";
import { Calendar as CalendarPrimitive } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, isSameDay, parseISO } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CalendarProps {
  selectedDate?: Date;
  onDateSelect: (date: Date | undefined) => void;
  completionData?: Array<{
    date: string;
    completionRate: number;
    totalScheduled: number;
    completed: number;
  }>;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
}

export function Calendar({
  selectedDate,
  onDateSelect,
  completionData = [],
  minDate,
  maxDate,
  className,
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date());

  // Create a map for quick lookup of completion data
  const completionMap = new Map(
    completionData.map((item) => [item.date, item])
  );

  const getDayCompletionRate = (date: Date): number => {
    const dateString = format(date, "yyyy-MM-dd");
    return completionMap.get(dateString)?.completionRate || 0;
  };

  const getDayData = (date: Date) => {
    const dateString = format(date, "yyyy-MM-dd");
    return completionMap.get(dateString);
  };

  const getCompletionColor = (completionRate: number): string => {
    if (completionRate >= 90)
      return "bg-green-400/20 text-green-400 border-green-400/30";
    if (completionRate >= 70)
      return "bg-blue-400/20 text-blue-400 border-blue-400/30";
    if (completionRate >= 50)
      return "bg-amber-400/20 text-amber-400 border-amber-400/30";
    if (completionRate > 0)
      return "bg-red-400/20 text-red-400 border-red-400/30";
    return "bg-muted-foreground/10 text-muted-foreground border-border";
  };

  const handlePreviousMonth = () => {
    const newDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() - 1,
      1
    );
    setCurrentMonth(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      1
    );
    setCurrentMonth(newDate);
  };

  const isDateDisabled = (date: Date): boolean => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-foreground">
              History Calendar
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Select a date to view detailed history
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousMonth}
              disabled={
                minDate &&
                new Date(
                  currentMonth.getFullYear(),
                  currentMonth.getMonth(),
                  0
                ) < minDate
              }
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextMonth}
              disabled={
                maxDate &&
                new Date(
                  currentMonth.getFullYear(),
                  currentMonth.getMonth() + 1,
                  1
                ) > maxDate
              }
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
          <span className="text-xs text-muted-foreground">
            Completion Rate:
          </span>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-400/20 border border-green-400/30"></div>
            <span className="text-xs text-muted-foreground">90%+</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-blue-400/20 border border-blue-400/30"></div>
            <span className="text-xs text-muted-foreground">70%+</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-amber-400/20 border border-amber-400/30"></div>
            <span className="text-xs text-muted-foreground">50%+</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-400/20 border border-red-400/30"></div>
            <span className="text-xs text-muted-foreground">&lt;50%</span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <CalendarPrimitive
          mode="single"
          selected={selectedDate}
          onSelect={onDateSelect}
          month={currentMonth}
          onMonthChange={setCurrentMonth}
          disabled={isDateDisabled}
          className="w-full"
          modifiers={{
            completed: (date) => getDayCompletionRate(date) >= 90,
            good: (date) =>
              getDayCompletionRate(date) >= 70 &&
              getDayCompletionRate(date) < 90,
            okay: (date) =>
              getDayCompletionRate(date) >= 50 &&
              getDayCompletionRate(date) < 70,
            poor: (date) =>
              getDayCompletionRate(date) > 0 && getDayCompletionRate(date) < 50,
            hasData: (date) => completionMap.has(format(date, "yyyy-MM-dd")),
          }}
          modifiersStyles={{
            completed: {
              backgroundColor: "rgb(74 222 128 / 0.2)",
              color: "rgb(74 222 128)",
              border: "1px solid rgb(74 222 128 / 0.3)",
            },
            good: {
              backgroundColor: "rgb(96 165 250 / 0.2)",
              color: "rgb(96 165 250)",
              border: "1px solid rgb(96 165 250 / 0.3)",
            },
            okay: {
              backgroundColor: "rgb(251 191 36 / 0.2)",
              color: "rgb(251 191 36)",
              border: "1px solid rgb(251 191 36 / 0.3)",
            },
            poor: {
              backgroundColor: "rgb(248 113 113 / 0.2)",
              color: "rgb(248 113 113)",
              border: "1px solid rgb(248 113 113 / 0.3)",
            },
          }}
        />

        {/* Selected Date Info */}
        {selectedDate && (
          <div className="mt-4 p-3 bg-card border border-border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-foreground">
                {format(selectedDate, "EEEE, MMMM d, yyyy")}
              </span>
            </div>

            {(() => {
              const dayData = getDayData(selectedDate);
              if (dayData) {
                return (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">
                        Completion Rate:
                      </span>
                      <span
                        className={cn(
                          "ml-2 font-medium",
                          dayData.completionRate >= 70
                            ? "text-green-400"
                            : dayData.completionRate >= 50
                            ? "text-amber-400"
                            : "text-red-400"
                        )}
                      >
                        {dayData.completionRate.toFixed(1)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Completed:</span>
                      <span className="ml-2 font-medium text-foreground">
                        {dayData.completed}/{dayData.totalScheduled}
                      </span>
                    </div>
                  </div>
                );
              } else {
                return (
                  <p className="text-sm text-muted-foreground">
                    No data available for this date
                  </p>
                );
              }
            })()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
