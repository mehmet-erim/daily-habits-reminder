import { Metadata } from "next";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import ReminderList from "@/components/ReminderList";
import {
  MobileLayout,
  MobileContainer,
} from "@/components/mobile/MobileLayout";

export const metadata: Metadata = {
  title: "Reminders - Daily Habits Tracker",
  description: "Manage your wellness reminders and healthy habits",
};

export default function RemindersPage() {
  return (
    <ProtectedRoute>
      <MobileLayout fullHeight enableSafeArea enableViewportFix>
        <MobileContainer className="py-6">
          <ReminderList />
        </MobileContainer>
      </MobileLayout>
    </ProtectedRoute>
  );
}
