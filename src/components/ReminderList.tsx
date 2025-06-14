"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import {
  Bell,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Clock,
  Calendar,
  Volume2,
  VolumeX,
  Moon,
  Repeat,
  MoreVertical,
  Power,
  PowerOff,
  Timer,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  REMINDER_CATEGORIES,
  parseDaysOfWeek,
  getDayNames,
} from "@/lib/validations";
import { toast } from "sonner";
import BulkOperations from "./BulkOperations";
import { Checkbox } from "@/components/ui/checkbox";
import { useIsMobile } from "@/hooks/use-mobile";

interface Reminder {
  id: string;
  title: string;
  description: string | null;
  category: string;
  isActive: boolean;
  reminderTime: string;
  daysOfWeek: string;
  timezone: string;
  soundEnabled: boolean;
  soundFile: string | null;
  vibrationEnabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  isRecurring: boolean;
  recurringInterval: number | null;
  recurringStartTime: string | null;
  recurringEndTime: string | null;
  snoozeEnabled: boolean;
  snoozeDuration: number;
  maxSnoozes: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface ReminderListProps {
  onEdit?: (reminder: Reminder) => void;
}

export default function ReminderList({ onEdit }: ReminderListProps) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [activeFilter, setActiveFilter] = useState("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedReminders, setSelectedReminders] = useState<string[]>([]);

  // Fetch reminders
  const fetchReminders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (categoryFilter !== "all") {
        params.append("category", categoryFilter);
      }

      if (activeFilter !== "all") {
        params.append("active", activeFilter);
      }

      const response = await fetch(`/api/reminders?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch reminders");
      }

      const data = await response.json();
      setReminders(data.reminders || []);
      setSelectedReminders([]); // Clear selections when data refreshes
    } catch (error) {
      console.error("Error fetching reminders:", error);
      toast.error("Failed to fetch reminders");
    } finally {
      setLoading(false);
    }
  };

  // Handle individual reminder selection
  const handleReminderSelect = (reminderId: string, checked: boolean) => {
    setSelectedReminders((prev) =>
      checked ? [...prev, reminderId] : prev.filter((id) => id !== reminderId)
    );
  };

  // Handle bulk operation completion
  const handleBulkOperationComplete = () => {
    fetchReminders(); // Refresh the list
  };

  // Clear all selections
  const handleClearSelection = () => {
    setSelectedReminders([]);
  };

  useEffect(() => {
    fetchReminders();
  }, [categoryFilter, activeFilter]);

  // Filter reminders based on search term
  const filteredReminders = reminders.filter(
    (reminder) =>
      reminder.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (reminder.description &&
        reminder.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Toggle reminder active status
  const toggleReminderStatus = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/reminders/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (!response.ok) {
        throw new Error("Failed to update reminder");
      }

      // Update local state
      setReminders((prev) =>
        prev.map((reminder) =>
          reminder.id === id ? { ...reminder, isActive: !isActive } : reminder
        )
      );

      toast.success(`Reminder ${!isActive ? "activated" : "deactivated"}`);
    } catch (error) {
      console.error("Error updating reminder:", error);
      toast.error("Failed to update reminder");
    }
  };

  // Delete reminder
  const deleteReminder = async (id: string) => {
    try {
      setDeletingId(id);
      const response = await fetch(`/api/reminders/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete reminder");
      }

      // Remove from local state
      setReminders((prev) => prev.filter((reminder) => reminder.id !== id));
      toast.success("Reminder deleted successfully");
    } catch (error) {
      console.error("Error deleting reminder:", error);
      toast.error("Failed to delete reminder");
    } finally {
      setDeletingId(null);
    }
  };

  // Format time for display
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground truncate">
              Reminders
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Manage your wellness reminders and habits
            </p>
          </div>
          <Button
            onClick={() => router.push("/reminders/new")}
            className="w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Reminder
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader className="pb-4">
          <div className="space-y-4">
            {/* Search */}
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search reminders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>

            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Category Filter */}
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:flex-1">
                  <Filter className="w-4 h-4 mr-2 flex-shrink-0" />
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {REMINDER_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      <span className="capitalize">{category}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Active Filter */}
              <Select value={activeFilter} onValueChange={setActiveFilter}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Bulk Operations */}
      <BulkOperations
        selectedReminders={selectedReminders}
        allReminders={filteredReminders}
        onSelectionChange={setSelectedReminders}
        onOperationComplete={handleBulkOperationComplete}
        onClearSelection={handleClearSelection}
      />

      {/* Reminders List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredReminders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No reminders found
              </h3>
              <p className="text-muted-foreground text-center mb-4 max-w-md">
                {searchTerm ||
                categoryFilter !== "all" ||
                activeFilter !== "all"
                  ? "Try adjusting your search or filters."
                  : "Get started by creating your first reminder."}
              </p>
              {!searchTerm &&
                categoryFilter === "all" &&
                activeFilter === "all" && (
                  <Button onClick={() => router.push("/reminders/new")}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Reminder
                  </Button>
                )}
            </CardContent>
          </Card>
        ) : (
          filteredReminders.map((reminder) => (
            <Card key={reminder.id} className="relative overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedReminders.includes(reminder.id)}
                    onCheckedChange={(checked) =>
                      handleReminderSelect(reminder.id, checked as boolean)
                    }
                    className="mt-1 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    {/* Title and Actions Row */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg text-foreground break-words leading-tight">
                          {reminder.title}
                        </CardTitle>
                      </div>
                      {/* Actions Dropdown */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex-shrink-0"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() =>
                              onEdit
                                ? onEdit(reminder)
                                : router.push(`/reminders/${reminder.id}/edit`)
                            }
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              toggleReminderStatus(
                                reminder.id,
                                reminder.isActive
                              )
                            }
                          >
                            {reminder.isActive ? (
                              <>
                                <PowerOff className="w-4 h-4 mr-2" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <Power className="w-4 h-4 mr-2" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onSelect={(e) => e.preventDefault()}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete Reminder
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "
                                  {reminder.title}
                                  "? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteReminder(reminder.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  disabled={deletingId === reminder.id}
                                >
                                  {deletingId === reminder.id
                                    ? "Deleting..."
                                    : "Delete"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Badge
                        variant={reminder.isActive ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {reminder.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Badge variant="outline" className="text-xs capitalize">
                        {reminder.category}
                      </Badge>
                    </div>

                    {/* Description */}
                    {reminder.description && (
                      <CardDescription className="text-sm break-words">
                        {reminder.description}
                      </CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="space-y-3">
                  {/* Schedule Info */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 flex-shrink-0" />
                      <span className="break-words">
                        {reminder.isRecurring &&
                        reminder.recurringStartTime &&
                        reminder.recurringEndTime
                          ? `${formatTime(
                              reminder.recurringStartTime
                            )} - ${formatTime(reminder.recurringEndTime)}`
                          : formatTime(reminder.reminderTime)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      <span className="break-words">
                        {getDayNames(parseDaysOfWeek(reminder.daysOfWeek)).join(
                          ", "
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Recurring Info */}
                  {reminder.isRecurring && reminder.recurringInterval && (
                    <div className="bg-blue-400/10 border border-blue-400/20 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-blue-400 text-sm font-medium">
                        <Timer className="w-4 h-4" />
                        <span>Recurring Notifications</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Every {reminder.recurringInterval} minutes from{" "}
                        {reminder.recurringStartTime &&
                          formatTime(reminder.recurringStartTime)}{" "}
                        to{" "}
                        {reminder.recurringEndTime &&
                          formatTime(reminder.recurringEndTime)}
                        {reminder.quietHoursEnabled &&
                          " (respects quiet hours)"}
                      </p>
                    </div>
                  )}

                  <Separator />

                  {/* Settings Icons */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      {reminder.soundEnabled ? (
                        <Volume2 className="w-3 h-3" />
                      ) : (
                        <VolumeX className="w-3 h-3" />
                      )}
                      <span>Sound</span>
                    </div>

                    {reminder.quietHoursEnabled && (
                      <div className="flex items-center gap-1">
                        <Moon className="w-3 h-3" />
                        <span>Quiet Hours</span>
                      </div>
                    )}

                    {reminder.isRecurring && reminder.recurringInterval && (
                      <div className="flex items-center gap-1">
                        <Timer className="w-3 h-3" />
                        <span>Every {reminder.recurringInterval}m</span>
                      </div>
                    )}

                    {reminder.snoozeEnabled && (
                      <div className="flex items-center gap-1">
                        <Repeat className="w-3 h-3" />
                        <span>Snooze</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Stats */}
      {reminders.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-foreground">
                  {reminders.length}
                </div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-400">
                  {reminders.filter((r) => r.isActive).length}
                </div>
                <div className="text-xs text-muted-foreground">Active</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-400">
                  {reminders.filter((r) => !r.isActive).length}
                </div>
                <div className="text-xs text-muted-foreground">Inactive</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-400">
                  {new Set(reminders.map((r) => r.category)).size}
                </div>
                <div className="text-xs text-muted-foreground">Categories</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
