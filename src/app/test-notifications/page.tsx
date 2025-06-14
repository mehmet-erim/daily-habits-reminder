"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Bell,
  Volume2,
  VolumeX,
  TestTube2,
  Wifi,
  WifiOff,
  Settings,
  CheckCircle2,
} from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { useLogging } from "@/hooks/useLogging";
import {
  NotificationPopup,
  NotificationManager,
} from "@/components/NotificationPopup";
import { ActionButtons } from "@/components/ActionButtons";

export default function TestNotificationsPage() {
  const {
    permissionState,
    requestPermission,
    showReminder,
    testNotifications,
    settings,
    updateSettings,
    isLoading,
    error,
  } = useNotifications();

  const { syncLogs, isLogging, offlineLogsCount, isOnline, stats } =
    useLogging();

  const [showPopup, setShowPopup] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  const handleTestNotification = async () => {
    const success = await testNotifications();
    if (success) {
      console.log("Test notification sent successfully!");
    }
  };

  const handleShowReminderNotification = () => {
    showReminder(
      "Test Wellness Reminder",
      "This is a test reminder to check your wellness habits!",
      "wellness"
    );
  };

  const handleShowPopup = () => {
    setShowPopup(true);
  };

  const handleAddNotification = () => {
    const newNotification = {
      id: `test-${Date.now()}`,
      title: "Test Reminder",
      description: "This is a test notification popup",
      category: "wellness",
      reminderId: "test-reminder-id",
      timestamp: new Date(),
      autoCloseAfter: 30,
      soundEnabled: settings.soundEnabled,
      maxSnoozes: 3,
      currentSnoozeCount: 0,
    };

    setNotifications((prev) => [...prev, newNotification]);
  };

  const handleNotificationAction = (notificationId: string, action: string) => {
    console.log(`Notification ${notificationId} action: ${action}`);
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  };

  const handleNotificationSnooze = (
    notificationId: string,
    minutes: number
  ) => {
    console.log(
      `Notification ${notificationId} snoozed for ${minutes} minutes`
    );
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  };

  const handleNotificationClose = (notificationId: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  };

  const getPermissionBadge = () => {
    switch (permissionState.permission) {
      case "granted":
        return (
          <Badge className="bg-green-400/10 text-green-400 border-green-400/20">
            Granted
          </Badge>
        );
      case "denied":
        return (
          <Badge className="bg-red-400/10 text-red-400 border-red-400/20">
            Denied
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-400/10 text-yellow-400 border-yellow-400/20">
            Default
          </Badge>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Notification System Test
          </h1>
          <p className="text-muted-foreground">
            Test the notification system and logging functionality
          </p>
        </div>

        {/* Notification Permission Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Permission
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium">Status:</span>
                {getPermissionBadge()}
                <span className="text-sm text-muted-foreground">
                  (Supported: {permissionState.supported ? "Yes" : "No"})
                </span>
              </div>

              {permissionState.permission !== "granted" && (
                <Button
                  onClick={requestPermission}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <Bell className="h-4 w-4" />
                  Request Permission
                </Button>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-400/10 border border-red-400/20 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Notification Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="notifications-enabled"
                  checked={settings.enabled}
                  onCheckedChange={(enabled) => updateSettings({ enabled })}
                />
                <Label htmlFor="notifications-enabled">
                  Enable Notifications
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="sound-enabled"
                  checked={settings.soundEnabled}
                  onCheckedChange={(soundEnabled) =>
                    updateSettings({ soundEnabled })
                  }
                />
                <Label
                  htmlFor="sound-enabled"
                  className="flex items-center gap-2"
                >
                  {settings.soundEnabled ? (
                    <Volume2 className="h-4 w-4" />
                  ) : (
                    <VolumeX className="h-4 w-4" />
                  )}
                  Sound Enabled
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="vibration-enabled"
                  checked={settings.vibrationEnabled}
                  onCheckedChange={(vibrationEnabled) =>
                    updateSettings({ vibrationEnabled })
                  }
                />
                <Label htmlFor="vibration-enabled">Vibration Enabled</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="quiet-hours"
                  checked={settings.quietHoursEnabled}
                  onCheckedChange={(quietHoursEnabled) =>
                    updateSettings({ quietHoursEnabled })
                  }
                />
                <Label htmlFor="quiet-hours">
                  Quiet Hours ({settings.quietHoursStart} -{" "}
                  {settings.quietHoursEnd})
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube2 className="h-5 w-5" />
              Test Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Button
                onClick={handleTestNotification}
                disabled={isLoading || permissionState.permission !== "granted"}
                className="flex items-center gap-2"
              >
                <Bell className="h-4 w-4" />
                Test Browser Notification
              </Button>

              <Button
                onClick={handleShowReminderNotification}
                disabled={isLoading || permissionState.permission !== "granted"}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Bell className="h-4 w-4" />
                Test Reminder Notification
              </Button>

              <Button
                onClick={handleShowPopup}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Bell className="h-4 w-4" />
                Show Notification Popup
              </Button>

              <Button
                onClick={handleAddNotification}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Bell className="h-4 w-4" />
                Add to Notification Manager
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Logging Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isOnline ? (
                <Wifi className="h-5 w-5 text-green-400" />
              ) : (
                <WifiOff className="h-5 w-5 text-red-400" />
              )}
              Logging System Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">
                  {isOnline ? "Online" : "Offline"}
                </div>
                <div className="text-sm text-muted-foreground">
                  Connection Status
                </div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">
                  {offlineLogsCount}
                </div>
                <div className="text-sm text-muted-foreground">
                  Offline Logs
                </div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">
                  {stats.lastSyncAttempt ? "Recently" : "Never"}
                </div>
                <div className="text-sm text-muted-foreground">Last Sync</div>
              </div>
            </div>

            {offlineLogsCount > 0 && (
              <div className="flex justify-center">
                <Button
                  onClick={syncLogs}
                  disabled={isLogging || !isOnline}
                  className="flex items-center gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Sync Offline Logs
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons Demo */}
        <Card>
          <CardHeader>
            <CardTitle>Action Buttons Demo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Standard Action Buttons</h4>
                <ActionButtons
                  reminderId="demo-reminder-1"
                  onActionComplete={(action) =>
                    console.log(`Demo action completed: ${action}`)
                  }
                />
              </div>

              <div>
                <h4 className="font-medium mb-2">
                  Action Buttons (Snooze Limited)
                </h4>
                <ActionButtons
                  reminderId="demo-reminder-2"
                  currentSnoozeCount={2}
                  maxSnoozes={3}
                  onActionComplete={(action) =>
                    console.log(`Demo action completed: ${action}`)
                  }
                />
              </div>

              <div>
                <h4 className="font-medium mb-2">
                  Action Buttons (Max Snoozes Reached)
                </h4>
                <ActionButtons
                  reminderId="demo-reminder-3"
                  currentSnoozeCount={3}
                  maxSnoozes={3}
                  onActionComplete={(action) =>
                    console.log(`Demo action completed: ${action}`)
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notification Popup */}
      {showPopup && (
        <NotificationPopup
          id="test-popup"
          title="Test Notification"
          description="This is a test notification popup with auto-close functionality."
          category="wellness"
          reminderId="test-reminder"
          isVisible={showPopup}
          autoCloseAfter={60}
          soundEnabled={settings.soundEnabled}
          onAction={(action) => {
            console.log(`Popup action: ${action}`);
            setShowPopup(false);
          }}
          onClose={() => setShowPopup(false)}
          onSnooze={(minutes) => {
            console.log(`Popup snoozed for ${minutes} minutes`);
            setShowPopup(false);
          }}
        />
      )}

      {/* Notification Manager */}
      <NotificationManager
        notifications={notifications}
        onAction={handleNotificationAction}
        onSnooze={handleNotificationSnooze}
        onClose={handleNotificationClose}
      />
    </div>
  );
}
