import { Metadata } from "next";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import ReminderList from "@/components/ReminderList";

export const metadata: Metadata = {
  title: "Reminders - Daily Habits Tracker",
  description: "Manage your wellness reminders and healthy habits",
};

export default function RemindersPage() {
  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <ReminderList />
      </div>
    </ProtectedRoute>
  );
}
