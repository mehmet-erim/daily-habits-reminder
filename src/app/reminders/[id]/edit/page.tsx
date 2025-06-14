"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Metadata } from "next";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import ReminderForm from "@/components/ReminderForm";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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
  snoozeEnabled: boolean;
  snoozeDuration: number;
  maxSnoozes: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export default function EditReminderPage() {
  const params = useParams();
  const router = useRouter();
  const [reminder, setReminder] = useState<Reminder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reminderId = params.id as string;

  useEffect(() => {
    const fetchReminder = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/reminders/${reminderId}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError("Reminder not found");
          } else {
            throw new Error("Failed to fetch reminder");
          }
          return;
        }

        const data = await response.json();
        setReminder(data.reminder);
      } catch (err) {
        console.error("Error fetching reminder:", err);
        setError("Failed to load reminder");
        toast.error("Failed to load reminder");
      } finally {
        setLoading(false);
      }
    };

    if (reminderId) {
      fetchReminder();
    }
  }, [reminderId]);

  const handleSuccess = () => {
    toast.success("Reminder updated successfully!");
    router.push("/reminders");
  };

  const handleCancel = () => {
    router.push("/reminders");
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-4xl mx-auto">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Loading reminder...</p>
            </CardContent>
          </Card>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !reminder) {
    return (
      <ProtectedRoute>
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-4xl mx-auto">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {error || "Reminder not found"}
              </h3>
              <p className="text-muted-foreground text-center mb-4">
                {error === "Reminder not found"
                  ? "The reminder you're looking for doesn't exist or you don't have permission to edit it."
                  : "There was an error loading the reminder. Please try again."}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => router.push("/reminders")}
                >
                  Back to Reminders
                </Button>
                {error !== "Reminder not found" && (
                  <Button onClick={() => window.location.reload()}>
                    Try Again
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <ReminderForm
          mode="edit"
          reminder={reminder}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </ProtectedRoute>
  );
}
