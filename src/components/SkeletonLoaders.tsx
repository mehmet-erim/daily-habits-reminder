"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Enhanced skeleton with pulse animation
export function AnimatedSkeleton({
  className,
  delay = 0,
  ...props
}: React.ComponentProps<typeof Skeleton> & { delay?: number }) {
  return (
    <Skeleton
      className={cn("animate-pulse", className)}
      style={{ animationDelay: `${delay}ms` }}
      {...props}
    />
  );
}

// Reminder card skeleton with realistic proportions
export function ReminderCardSkeleton({ index = 0 }: { index?: number }) {
  const delay = index * 100; // Stagger animations

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex items-start space-x-4">
          {/* Avatar/Icon */}
          <AnimatedSkeleton
            className="h-10 w-10 rounded-full shrink-0"
            delay={delay}
          />

          <div className="flex-1 space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <AnimatedSkeleton className="h-5 w-3/4" delay={delay + 50} />
              <AnimatedSkeleton className="h-4 w-16" delay={delay + 100} />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <AnimatedSkeleton className="h-4 w-full" delay={delay + 150} />
              <AnimatedSkeleton className="h-4 w-2/3" delay={delay + 200} />
            </div>

            {/* Tags and metadata */}
            <div className="flex items-center space-x-2">
              <AnimatedSkeleton
                className="h-6 w-16 rounded-full"
                delay={delay + 250}
              />
              <AnimatedSkeleton
                className="h-6 w-20 rounded-full"
                delay={delay + 300}
              />
              <AnimatedSkeleton className="h-4 w-12" delay={delay + 350} />
            </div>

            {/* Action buttons */}
            <div className="flex space-x-2 pt-2">
              <AnimatedSkeleton
                className="h-8 w-16 rounded"
                delay={delay + 400}
              />
              <AnimatedSkeleton
                className="h-8 w-16 rounded"
                delay={delay + 450}
              />
              <AnimatedSkeleton
                className="h-8 w-20 rounded"
                delay={delay + 500}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Dashboard stats card skeleton
export function StatsCardSkeleton({ index = 0 }: { index?: number }) {
  const delay = index * 75;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <AnimatedSkeleton className="h-4 w-4" delay={delay} />
          <AnimatedSkeleton className="h-4 w-24" delay={delay + 50} />
        </div>
        <div className="space-y-2">
          <AnimatedSkeleton className="h-8 w-16" delay={delay + 100} />
          <AnimatedSkeleton className="h-3 w-32" delay={delay + 150} />
        </div>
      </CardContent>
    </Card>
  );
}

// Chart skeleton with realistic chart-like pattern
export function ChartSkeleton({
  height = "h-64",
  showLegend = true,
  index = 0,
}: {
  height?: string;
  showLegend?: boolean;
  index?: number;
}) {
  const delay = index * 100;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <AnimatedSkeleton className="h-5 w-32" delay={delay} />
          <AnimatedSkeleton className="h-4 w-16" delay={delay + 50} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Chart area with bars */}
          <div className={cn("relative", height)}>
            <div className="absolute inset-0 flex items-end justify-between space-x-2">
              {Array.from({ length: 7 }).map((_, i) => (
                <AnimatedSkeleton
                  key={i}
                  className="w-8 bg-muted rounded-t"
                  style={{
                    height: `${Math.random() * 60 + 20}%`,
                    animationDelay: `${delay + 100 + i * 50}ms`,
                  }}
                />
              ))}
            </div>
          </div>

          {/* X-axis labels */}
          <div className="flex justify-between">
            {Array.from({ length: 7 }).map((_, i) => (
              <AnimatedSkeleton
                key={i}
                className="h-3 w-8"
                delay={delay + 500 + i * 25}
              />
            ))}
          </div>

          {/* Legend */}
          {showLegend && (
            <div className="flex items-center justify-center space-x-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-2">
                  <AnimatedSkeleton
                    className="h-3 w-3 rounded-full"
                    delay={delay + 700 + i * 50}
                  />
                  <AnimatedSkeleton
                    className="h-3 w-16"
                    delay={delay + 750 + i * 50}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Calendar skeleton
export function CalendarSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <AnimatedSkeleton className="h-5 w-24" />
          <div className="flex space-x-2">
            <AnimatedSkeleton className="h-8 w-8 rounded" delay={50} />
            <AnimatedSkeleton className="h-8 w-8 rounded" delay={100} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <AnimatedSkeleton
                key={i}
                className="h-8 w-full text-center"
                delay={i * 25}
              />
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, i) => (
              <AnimatedSkeleton
                key={i}
                className="h-8 w-8 rounded"
                delay={200 + (i % 7) * 25 + Math.floor(i / 7) * 100}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Form skeleton
export function FormSkeleton({
  fields = 4,
  showActions = true,
}: {
  fields?: number;
  showActions?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <AnimatedSkeleton className="h-6 w-48" />
        <AnimatedSkeleton className="h-4 w-64" delay={50} />
      </CardHeader>
      <CardContent className="space-y-6">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-2">
            <AnimatedSkeleton className="h-4 w-24" delay={100 + i * 50} />
            <AnimatedSkeleton className="h-10 w-full" delay={150 + i * 50} />
          </div>
        ))}

        {showActions && (
          <div className="flex space-x-2 pt-4">
            <AnimatedSkeleton className="h-10 w-24" delay={400} />
            <AnimatedSkeleton className="h-10 w-16" delay={450} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// List with items skeleton
export function ListSkeleton({
  items = 5,
  showHeader = true,
  itemHeight = "h-16",
}: {
  items?: number;
  showHeader?: boolean;
  itemHeight?: string;
}) {
  return (
    <div className="space-y-4">
      {showHeader && (
        <div className="flex items-center justify-between">
          <AnimatedSkeleton className="h-6 w-32" />
          <AnimatedSkeleton className="h-8 w-20" delay={50} />
        </div>
      )}

      <div className="space-y-2">
        {Array.from({ length: items }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "flex items-center space-x-4 p-3 border border-border rounded-lg",
              itemHeight
            )}
          >
            <AnimatedSkeleton
              className="h-8 w-8 rounded-full shrink-0"
              delay={i * 50}
            />
            <div className="flex-1 space-y-2">
              <AnimatedSkeleton className="h-4 w-3/4" delay={i * 50 + 25} />
              <AnimatedSkeleton className="h-3 w-1/2" delay={i * 50 + 50} />
            </div>
            <AnimatedSkeleton className="h-8 w-8 rounded" delay={i * 50 + 75} />
          </div>
        ))}
      </div>
    </div>
  );
}

// Counter/meter component skeleton
export function CounterSkeleton({ index = 0 }: { index?: number }) {
  const delay = index * 100;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <AnimatedSkeleton className="h-5 w-5" delay={delay} />
            <AnimatedSkeleton className="h-4 w-20" delay={delay + 50} />
          </div>
          <AnimatedSkeleton
            className="h-6 w-12 rounded-full"
            delay={delay + 100}
          />
        </div>

        <div className="text-center space-y-3">
          <AnimatedSkeleton className="h-12 w-16 mx-auto" delay={delay + 150} />
          <AnimatedSkeleton className="h-3 w-24 mx-auto" delay={delay + 200} />

          <div className="flex justify-center space-x-2 pt-2">
            <AnimatedSkeleton
              className="h-8 w-8 rounded-full"
              delay={delay + 250}
            />
            <AnimatedSkeleton
              className="h-8 w-8 rounded-full"
              delay={delay + 300}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Navigation skeleton
export function NavigationSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 border-b border-border">
      <div className="flex items-center space-x-4">
        <AnimatedSkeleton className="h-8 w-8 rounded" />
        <AnimatedSkeleton className="h-6 w-32" delay={50} />
      </div>

      <div className="flex items-center space-x-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <AnimatedSkeleton
            key={i}
            className="h-8 w-20 rounded"
            delay={100 + i * 50}
          />
        ))}
      </div>
    </div>
  );
}

// Composite dashboard skeleton
export function DashboardSkeleton() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Navigation */}
      <NavigationSkeleton />

      {/* Header */}
      <div className="space-y-2">
        <AnimatedSkeleton className="h-8 w-64" />
        <AnimatedSkeleton className="h-4 w-96" delay={50} />
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatsCardSkeleton key={i} index={i} />
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <ReminderCardSkeleton key={i} index={i} />
          ))}
        </div>

        <div className="space-y-6">
          <CalendarSkeleton />
          {Array.from({ length: 2 }).map((_, i) => (
            <CounterSkeleton key={i} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

// Generic content skeleton with shimmer effect
export function ShimmerSkeleton({
  width = "w-full",
  height = "h-4",
  className,
}: {
  width?: string;
  height?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_2s_infinite] rounded",
        width,
        height,
        className
      )}
    />
  );
}
