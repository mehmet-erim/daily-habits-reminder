"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Bell,
  Volume2,
  Moon,
  Repeat,
  Save,
  X,
  Sparkles,
} from "lucide-react";
import {
  createReminderSchema,
  updateReminderSchema,
  CreateReminderFormData,
  UpdateReminderFormData,
  REMINDER_CATEGORIES,
  DAYS_OF_WEEK,
  RECURRING_INTERVALS,
  parseDaysOfWeek,
} from "@/lib/validations";
import { toast } from "sonner";
import ReminderTemplates from "./ReminderTemplates";

interface ReminderFormProps {
  mode: "create" | "edit";
  reminder?: any; // Prisma reminder object
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ReminderForm({
  mode,
  reminder,
  onSuccess,
  onCancel,
}: ReminderFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  // Determine which schema to use based on mode
  const schema =
    mode === "create" ? createReminderSchema : updateReminderSchema;

  // Set up form with default values
  const form = useForm<CreateReminderFormData | UpdateReminderFormData>({
    resolver: zodResolver(schema),
    defaultValues:
      mode === "edit" && reminder
        ? {
            title: reminder.title,
            description: reminder.description || "",
            category: reminder.category,
            reminderTime: reminder.reminderTime,
            daysOfWeek: parseDaysOfWeek(reminder.daysOfWeek),
            timezone: reminder.timezone,
            isActive: reminder.isActive,
            soundEnabled: reminder.soundEnabled,
            soundFile: reminder.soundFile || "",
            vibrationEnabled: reminder.vibrationEnabled,
            quietHoursEnabled: reminder.quietHoursEnabled,
            quietHoursStart: reminder.quietHoursStart || "",
            quietHoursEnd: reminder.quietHoursEnd || "",
            isRecurring: reminder.isRecurring || false,
            recurringInterval: reminder.recurringInterval || 30,
            recurringStartTime:
              reminder.recurringStartTime || reminder.reminderTime,
            recurringEndTime: reminder.recurringEndTime || "",
            snoozeEnabled: reminder.snoozeEnabled,
            snoozeDuration: reminder.snoozeDuration,
            maxSnoozes: reminder.maxSnoozes,
          }
        : {
            title: "",
            description: "",
            category: "wellness",
            reminderTime: "09:00",
            daysOfWeek: [1, 2, 3, 4, 5], // Weekdays by default
            timezone: "UTC",
            isActive: true,
            soundEnabled: true,
            soundFile: "",
            vibrationEnabled: true,
            quietHoursEnabled: false,
            quietHoursStart: "22:00",
            quietHoursEnd: "07:00",
            isRecurring: false,
            recurringInterval: 30,
            recurringStartTime: "09:00",
            recurringEndTime: "17:00",
            snoozeEnabled: true,
            snoozeDuration: 5,
            maxSnoozes: 3,
          },
  });

  const watchQuietHours = form.watch("quietHoursEnabled");
  const watchDaysOfWeek = form.watch("daysOfWeek");
  const watchIsRecurring = form.watch("isRecurring");

  const handleSubmit = async (
    data: CreateReminderFormData | UpdateReminderFormData
  ) => {
    setIsSubmitting(true);
    try {
      const url =
        mode === "create" ? "/api/reminders" : `/api/reminders/${reminder?.id}`;
      const method = mode === "create" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to ${mode} reminder`);
      }

      toast.success(
        `Reminder ${mode === "create" ? "created" : "updated"} successfully!`
      );

      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/reminders");
      }
    } catch (error) {
      console.error(`Error ${mode}ing reminder:`, error);
      toast.error(
        error instanceof Error ? error.message : `Failed to ${mode} reminder`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDayToggle = (dayValue: number, checked: boolean) => {
    const currentDays = form.getValues("daysOfWeek") || [];
    if (checked) {
      form.setValue("daysOfWeek", [...currentDays, dayValue].sort());
    } else {
      form.setValue(
        "daysOfWeek",
        currentDays.filter((day) => day !== dayValue)
      );
    }
  };

  const handleTemplateSelect = (
    templateData: CreateReminderFormData | UpdateReminderFormData
  ) => {
    // Apply template data to form
    Object.entries(templateData).forEach(([key, value]) => {
      if (value !== undefined) {
        form.setValue(key as any, value as any);
      }
    });
    setShowTemplates(false);
    toast.success("Template applied successfully!");
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          {mode === "create" ? "Create New Reminder" : "Edit Reminder"}
        </CardTitle>
        <CardDescription>
          {mode === "create"
            ? "Set up a new wellness reminder to help maintain healthy habits."
            : "Update your reminder settings and preferences."}
        </CardDescription>

        {mode === "create" && (
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowTemplates(true)}
              className="flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Use Template
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            {/* Basic Tab */}
            <TabsContent value="basic" className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Drink water, Take medication..."
                    {...form.register("title")}
                    className="mt-1"
                  />
                  {form.formState.errors.title && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.title.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Optional description or notes..."
                    {...form.register("description")}
                    className="mt-1"
                    rows={3}
                  />
                  {form.formState.errors.description && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.description.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={form.watch("category")}
                    onValueChange={(value) =>
                      form.setValue("category", value as any)
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {REMINDER_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          <span className="capitalize">{category}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.category && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.category.message}
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={form.watch("isActive")}
                    onCheckedChange={(checked) =>
                      form.setValue("isActive", checked)
                    }
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
              </div>
            </TabsContent>

            {/* Schedule Tab */}
            <TabsContent value="schedule" className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <Label
                    htmlFor="reminderTime"
                    className="flex items-center gap-2"
                  >
                    <Clock className="h-4 w-4" />
                    Reminder Time *
                  </Label>
                  <Input
                    id="reminderTime"
                    type="time"
                    {...form.register("reminderTime")}
                    className="mt-1"
                  />
                  {form.formState.errors.reminderTime && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.reminderTime.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label className="flex items-center gap-2">
                    <Repeat className="h-4 w-4" />
                    Days of Week *
                  </Label>
                  <div className="grid grid-cols-7 gap-2 mt-2">
                    {DAYS_OF_WEEK.map((day) => (
                      <div
                        key={day.value}
                        className="flex flex-col items-center space-y-2"
                      >
                        <Checkbox
                          id={`day-${day.value}`}
                          checked={
                            watchDaysOfWeek?.includes(day.value) || false
                          }
                          onCheckedChange={(checked) =>
                            handleDayToggle(day.value, checked as boolean)
                          }
                        />
                        <Label
                          htmlFor={`day-${day.value}`}
                          className="text-xs text-center cursor-pointer"
                        >
                          {day.label.slice(0, 3)}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {form.formState.errors.daysOfWeek && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.daysOfWeek.message}
                    </p>
                  )}
                  <div className="mt-2">
                    <Badge variant="outline" className="text-xs">
                      {watchDaysOfWeek?.length || 0} day
                      {(watchDaysOfWeek?.length || 0) !== 1 ? "s" : ""} selected
                    </Badge>
                  </div>
                </div>

                <Separator />

                {/* Recurring Notifications Section */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isRecurring"
                      checked={watchIsRecurring}
                      onCheckedChange={(checked) =>
                        form.setValue("isRecurring", checked)
                      }
                    />
                    <Label
                      htmlFor="isRecurring"
                      className="flex items-center gap-2"
                    >
                      <Repeat className="h-4 w-4" />
                      Recurring Notifications
                    </Label>
                  </div>

                  {watchIsRecurring && (
                    <div className="grid gap-4 ml-6 p-4 bg-muted/20 rounded-lg border">
                      <div className="text-sm text-muted-foreground">
                        Send notifications repeatedly throughout the day at
                        regular intervals. Perfect for exercises, hydration
                        reminders, or posture checks.
                      </div>

                      <div>
                        <Label htmlFor="recurringInterval">
                          Notification Interval
                        </Label>
                        <Select
                          value={form.watch("recurringInterval")?.toString()}
                          onValueChange={(value) =>
                            form.setValue("recurringInterval", parseInt(value))
                          }
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select interval" />
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
                        {form.formState.errors.recurringInterval && (
                          <p className="text-sm text-destructive mt-1">
                            {form.formState.errors.recurringInterval.message}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="recurringStartTime">Start Time</Label>
                          <Input
                            id="recurringStartTime"
                            type="time"
                            {...form.register("recurringStartTime")}
                            className="mt-1"
                          />
                          {form.formState.errors.recurringStartTime && (
                            <p className="text-sm text-destructive mt-1">
                              {form.formState.errors.recurringStartTime.message}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            When to start recurring notifications
                          </p>
                        </div>

                        <div>
                          <Label htmlFor="recurringEndTime">End Time *</Label>
                          <Input
                            id="recurringEndTime"
                            type="time"
                            {...form.register("recurringEndTime")}
                            className="mt-1"
                          />
                          {form.formState.errors.recurringEndTime && (
                            <p className="text-sm text-destructive mt-1">
                              {form.formState.errors.recurringEndTime.message}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            When to stop recurring notifications
                          </p>
                        </div>
                      </div>

                      {/* Preview section */}
                      {watchIsRecurring &&
                        form.watch("recurringInterval") &&
                        form.watch("recurringStartTime") &&
                        form.watch("recurringEndTime") && (
                          <div className="bg-card border rounded-lg p-3">
                            <p className="text-sm font-medium text-foreground mb-2">
                              📅 Recurring Schedule Preview:
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Notifications every{" "}
                              {form.watch("recurringInterval")} minutes from{" "}
                              {form.watch("recurringStartTime")} to{" "}
                              {form.watch("recurringEndTime")}
                              {watchQuietHours && " (respecting quiet hours)"}
                            </p>
                          </div>
                        )}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-4">
              <div className="grid gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="soundEnabled"
                    checked={form.watch("soundEnabled")}
                    onCheckedChange={(checked) =>
                      form.setValue("soundEnabled", checked)
                    }
                  />
                  <Label
                    htmlFor="soundEnabled"
                    className="flex items-center gap-2"
                  >
                    <Volume2 className="h-4 w-4" />
                    Sound Notifications
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="vibrationEnabled"
                    checked={form.watch("vibrationEnabled")}
                    onCheckedChange={(checked) =>
                      form.setValue("vibrationEnabled", checked)
                    }
                  />
                  <Label htmlFor="vibrationEnabled">Vibration (Mobile)</Label>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="quietHoursEnabled"
                      checked={watchQuietHours}
                      onCheckedChange={(checked) =>
                        form.setValue("quietHoursEnabled", checked)
                      }
                    />
                    <Label
                      htmlFor="quietHoursEnabled"
                      className="flex items-center gap-2"
                    >
                      <Moon className="h-4 w-4" />
                      Quiet Hours
                    </Label>
                  </div>

                  {watchQuietHours && (
                    <div className="grid grid-cols-2 gap-4 ml-6">
                      <div>
                        <Label htmlFor="quietHoursStart">Start Time</Label>
                        <Input
                          id="quietHoursStart"
                          type="time"
                          {...form.register("quietHoursStart")}
                          className="mt-1"
                        />
                        {form.formState.errors.quietHoursStart && (
                          <p className="text-sm text-destructive mt-1">
                            {form.formState.errors.quietHoursStart.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="quietHoursEnd">End Time</Label>
                        <Input
                          id="quietHoursEnd"
                          type="time"
                          {...form.register("quietHoursEnd")}
                          className="mt-1"
                        />
                        {form.formState.errors.quietHoursEnd && (
                          <p className="text-sm text-destructive mt-1">
                            {form.formState.errors.quietHoursEnd.message}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Advanced Tab */}
            <TabsContent value="advanced" className="space-y-4">
              <div className="grid gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="snoozeEnabled"
                    checked={form.watch("snoozeEnabled")}
                    onCheckedChange={(checked) =>
                      form.setValue("snoozeEnabled", checked)
                    }
                  />
                  <Label htmlFor="snoozeEnabled">Enable Snooze</Label>
                </div>

                {form.watch("snoozeEnabled") && (
                  <div className="grid grid-cols-2 gap-4 ml-6">
                    <div>
                      <Label htmlFor="snoozeDuration">
                        Snooze Duration (minutes)
                      </Label>
                      <Input
                        id="snoozeDuration"
                        type="number"
                        min="1"
                        max="60"
                        {...form.register("snoozeDuration", {
                          valueAsNumber: true,
                        })}
                        className="mt-1"
                      />
                      {form.formState.errors.snoozeDuration && (
                        <p className="text-sm text-destructive mt-1">
                          {form.formState.errors.snoozeDuration.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="maxSnoozes">Max Snoozes</Label>
                      <Input
                        id="maxSnoozes"
                        type="number"
                        min="1"
                        max="10"
                        {...form.register("maxSnoozes", {
                          valueAsNumber: true,
                        })}
                        className="mt-1"
                      />
                      {form.formState.errors.maxSnoozes && (
                        <p className="text-sm text-destructive mt-1">
                          {form.formState.errors.maxSnoozes.message}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel || (() => router.back())}
              disabled={isSubmitting}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              <Save className="w-4 h-4 mr-2" />
              {isSubmitting
                ? mode === "create"
                  ? "Creating..."
                  : "Updating..."
                : mode === "create"
                ? "Create Reminder"
                : "Update Reminder"}
            </Button>
          </div>
        </form>
      </CardContent>

      {/* Template Selection Dialog */}
      {showTemplates && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-7xl w-full max-h-[90vh] overflow-hidden">
            <ReminderTemplates
              onSelectTemplate={handleTemplateSelect}
              onClose={() => setShowTemplates(false)}
            />
          </div>
        </div>
      )}
    </Card>
  );
}
