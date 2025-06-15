"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Timer, Clock, Play, Pause, Bell } from "lucide-react";
import {
  calculateRecurringTimes,
  calculateDailyNotificationCount,
  getNextRecurringNotification,
  timeToMinutes,
  RecurringReminderConfig,
} from "@/lib/recurring-notifications";
import { useRecurringNotifications } from "@/hooks/useRecurringNotifications";
import { RECURRING_INTERVALS } from "@/lib/validations";
import { toast } from "sonner";

export default function TestRecurringPage() {
  // Test configuration
  const [testConfig, setTestConfig] = useState<RecurringReminderConfig>({
    id: "test-reminder",
    title: "Test Recurring Reminder",
    description: "This is a test for recurring notifications",
    category: "exercise",
    isRecurring: true,
    recurringInterval: 30,
    recurringStartTime: "09:00",
    recurringEndTime: "17:00",
    soundEnabled: true,
    quietHoursEnabled: false,
    quietHoursStart: "22:00",
    quietHoursEnd: "07:00",
    timezone: "UTC",
    daysOfWeek: [1, 2, 3, 4, 5], // Weekdays
  });

  // Live notifications
  const [liveReminders, setLiveReminders] = useState<RecurringReminderConfig[]>(
    []
  );

  const {
    isActive,
    nextNotifications,
    startScheduler,
    stopScheduler,
    processReminder,
  } = useRecurringNotifications({
    reminders: liveReminders,
    checkInterval: 5000, // Check every 5 seconds for demo
  });

  // Calculated values
  const [calculatedTimes, setCalculatedTimes] = useState<string[]>([]);
  const [dailyCount, setDailyCount] = useState<number>(0);
  const [nextTime, setNextTime] = useState<Date | null>(null);

  // Update calculations when config changes
  useEffect(() => {
    if (testConfig.isRecurring) {
      const times = calculateRecurringTimes(
        testConfig.recurringStartTime,
        testConfig.recurringEndTime,
        testConfig.recurringInterval
      );
      setCalculatedTimes(times);

      const count = calculateDailyNotificationCount(
        testConfig.recurringStartTime,
        testConfig.recurringEndTime,
        testConfig.recurringInterval
      );
      setDailyCount(count);

      const next = getNextRecurringNotification(testConfig);
      setNextTime(next);
    }
  }, [testConfig]);

  const handleConfigChange = (
    field: keyof RecurringReminderConfig,
    value: any
  ) => {
    setTestConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const addToLiveScheduler = () => {
    setLiveReminders((prev) => {
      const filtered = prev.filter((r) => r.id !== testConfig.id);
      return [...filtered, testConfig];
    });
    toast.success("Added to live scheduler");
  };

  const removeFromLiveScheduler = () => {
    setLiveReminders((prev) => prev.filter((r) => r.id !== testConfig.id));
    toast.success("Removed from live scheduler");
  };

  const testNotification = () => {
    const sent = processReminder(testConfig.id);
    if (sent) {
      toast.success("Test notification sent!");
    } else {
      toast.info("Notification would not be sent (conditions not met)");
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getCurrentTime = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, "0")}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div className="container mx-auto p-4 space-y-6 max-w-4xl">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Recurring Notifications Test
        </h1>
        <p className="text-muted-foreground">
          Test and preview the recurring notification feature
        </p>
      </div>

      {/* Configuration Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5" />
            Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={testConfig.title}
                onChange={(e) => handleConfigChange("title", e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="interval">Interval</Label>
              <Select
                value={testConfig.recurringInterval.toString()}
                onValueChange={(value) =>
                  handleConfigChange("recurringInterval", parseInt(value))
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RECURRING_INTERVALS.map((interval) => (
                    <SelectItem
                      key={interval.value}
                      value={interval.value.toString()}
                    >
                      {interval.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={testConfig.recurringStartTime}
                onChange={(e) =>
                  handleConfigChange("recurringStartTime", e.target.value)
                }
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={testConfig.recurringEndTime}
                onChange={(e) =>
                  handleConfigChange("recurringEndTime", e.target.value)
                }
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="isRecurring"
                checked={testConfig.isRecurring}
                onCheckedChange={(checked) =>
                  handleConfigChange("isRecurring", checked)
                }
              />
              <Label htmlFor="isRecurring">Enable Recurring</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="soundEnabled"
                checked={testConfig.soundEnabled}
                onCheckedChange={(checked) =>
                  handleConfigChange("soundEnabled", checked)
                }
              />
              <Label htmlFor="soundEnabled">Sound</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="quietHours"
                checked={testConfig.quietHoursEnabled}
                onCheckedChange={(checked) =>
                  handleConfigChange("quietHoursEnabled", checked)
                }
              />
              <Label htmlFor="quietHours">Quiet Hours</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Schedule Preview
            <Badge variant="outline" className="ml-auto">
              Current: {getCurrentTime()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {dailyCount}
                </div>
                <div className="text-sm text-muted-foreground">
                  Notifications/Day
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">
                  {testConfig.recurringInterval}m
                </div>
                <div className="text-sm text-muted-foreground">Interval</div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">
                  {(
                    (timeToMinutes(testConfig.recurringEndTime) -
                      timeToMinutes(testConfig.recurringStartTime)) /
                    60
                  ).toFixed(1)}
                  h
                </div>
                <div className="text-sm text-muted-foreground">Duration</div>
              </div>
            </Card>
          </div>

          {nextTime && (
            <div className="bg-green-400/10 border border-green-400/20 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-400 font-medium">
                <Bell className="h-4 w-4" />
                Next Notification
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {nextTime.toLocaleString()}
              </p>
            </div>
          )}

          <Separator />

          <div>
            <Label className="text-sm font-medium">
              Scheduled Times ({calculatedTimes.length} total)
            </Label>
            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2 mt-2">
              {calculatedTimes.map((time, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="text-xs justify-center"
                >
                  {formatTime(time)}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live Scheduler Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Live Scheduler
            <Badge
              variant={isActive ? "default" : "secondary"}
              className="ml-auto"
            >
              {isActive ? "Running" : "Stopped"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button onClick={addToLiveScheduler} variant="outline" size="sm">
              Add to Scheduler
            </Button>

            <Button
              onClick={removeFromLiveScheduler}
              variant="outline"
              size="sm"
            >
              Remove from Scheduler
            </Button>

            <Button
              onClick={isActive ? stopScheduler : startScheduler}
              variant={isActive ? "destructive" : "default"}
              size="sm"
            >
              {isActive ? (
                <>
                  <Pause className="h-4 w-4 mr-1" />
                  Stop
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-1" />
                  Start
                </>
              )}
            </Button>

            <Button onClick={testNotification} variant="outline" size="sm">
              <Bell className="h-4 w-4 mr-1" />
              Test Now
            </Button>
          </div>

          {nextNotifications.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Next Scheduled Notifications
              </Label>
              {nextNotifications.slice(0, 3).map((notification, index) => (
                <div
                  key={notification.reminderId}
                  className="flex items-center justify-between bg-muted/20 rounded p-2"
                >
                  <span className="text-sm">{notification.title}</span>
                  <Badge variant="outline" className="text-xs">
                    {notification.nextTime.toLocaleTimeString()}
                  </Badge>
                </div>
              ))}
            </div>
          )}

          <div className="text-xs text-muted-foreground">
            Active reminders: {liveReminders.length} | Checking every 5 seconds
            for demo purposes
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
