import { Metadata } from "next";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import ReminderForm from "@/components/ReminderForm";

export const metadata: Metadata = {
  title: "Create Reminder - Daily Habits Tracker",
  description: "Create a new wellness reminder to help maintain healthy habits",
};

export default function NewReminderPage() {
  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <ReminderForm mode="create" />
      </div>
    </ProtectedRoute>
  );
}
