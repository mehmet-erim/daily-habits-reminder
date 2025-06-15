"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  Bell,
  Palette,
  Shield,
  User,
  Globe,
  Database,
  Volume2,
  Clock,
  Smartphone,
  ArrowLeft,
  Save,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import SoundSettings from "@/components/SoundSettings";
import BackupRestore from "@/components/BackupRestore";
import {
  getUserSettings,
  saveUserSettings,
  resetAllSettings,
  getDefaultSettings,
  updateSettingsPartial,
} from "@/lib/backup";

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState(getUserSettings());
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Update settings and track changes
  const updateSettings = (path: string, value: any) => {
    const newSettings = { ...settings };
    const keys = path.split(".");

    let current = newSettings as any;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = value;
    setSettings(newSettings);
    setHasChanges(true);
  };

  // Save settings
  const handleSave = async () => {
    setIsSaving(true);

    try {
      saveUserSettings(settings);
      setHasChanges(false);
      toast.success("Settings saved successfully");
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  // Reset all settings
  const handleReset = async () => {
    try {
      resetAllSettings();
      setSettings(getDefaultSettings());
      setHasChanges(false);
      toast.success("Settings reset to defaults");
    } catch (error) {
      console.error("Failed to reset settings:", error);
      toast.error("Failed to reset settings");
    }
  };

  // Get timezone options
  const getTimezoneOptions = () => {
    const timezones = [
      "UTC",
      "America/New_York",
      "America/Los_Angeles",
      "America/Chicago",
      "America/Denver",
      "Europe/London",
      "Europe/Paris",
      "Europe/Berlin",
      "Asia/Tokyo",
      "Asia/Shanghai",
      "Asia/Dubai",
      "Australia/Sydney",
    ];

    return timezones.map((tz) => ({
      value: tz,
      label: tz.replace(/_/g, " "),
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="flex items-center gap-2 flex-shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back</span>
              </Button>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                  <Settings className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
                  <span className="truncate">Settings</span>
                </h1>
                <p className="text-sm text-muted-foreground hidden sm:block">
                  Customize your wellness tracker experience
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              {hasChanges && (
                <Badge variant="outline" className="text-amber-600 self-center">
                  Unsaved changes
                </Badge>
              )}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="flex items-center gap-2 flex-1 sm:flex-initial"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!hasChanges || isSaving}
                  className="flex items-center gap-2 flex-1 sm:flex-initial"
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        <Tabs defaultValue="general" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 gap-1 h-auto p-1">
            <TabsTrigger
              value="general"
              className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 text-xs sm:text-sm"
            >
              <Settings className="h-4 w-4" />
              <span>General</span>
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 text-xs sm:text-sm"
            >
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
              <span className="sm:hidden">Notify</span>
            </TabsTrigger>
            <TabsTrigger
              value="appearance"
              className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 text-xs sm:text-sm"
            >
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Appearance</span>
              <span className="sm:hidden">Theme</span>
            </TabsTrigger>
            <TabsTrigger value="sounds" className="flex items-center gap-2">
              <Volume2 className="h-4 w-4" />
              Sounds
            </TabsTrigger>
            <TabsTrigger value="backup" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Backup
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Privacy
            </TabsTrigger>
          </TabsList>

          {/* General Tab */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Regional Settings
                </CardTitle>
                <CardDescription>
                  Configure your timezone, language, and date/time preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Timezone */}
                  <div className="space-y-2">
                    <Label>Timezone</Label>
                    <Select
                      value={settings.general.timezone}
                      onValueChange={(value) =>
                        updateSettings("general.timezone", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {getTimezoneOptions().map((tz) => (
                          <SelectItem key={tz.value} value={tz.value}>
                            {tz.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Language */}
                  <div className="space-y-2">
                    <Label>Language</Label>
                    <Select
                      value={settings.general.language}
                      onValueChange={(value) =>
                        updateSettings("general.language", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                        <SelectItem value="fr">Français</SelectItem>
                        <SelectItem value="de">Deutsch</SelectItem>
                        <SelectItem value="it">Italiano</SelectItem>
                        <SelectItem value="pt">Português</SelectItem>
                        <SelectItem value="zh">中文</SelectItem>
                        <SelectItem value="ja">日本語</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Date Format */}
                  <div className="space-y-2">
                    <Label>Date Format</Label>
                    <Select
                      value={settings.general.dateFormat}
                      onValueChange={(value) =>
                        updateSettings("general.dateFormat", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yyyy-MM-dd">YYYY-MM-DD</SelectItem>
                        <SelectItem value="MM/dd/yyyy">MM/DD/YYYY</SelectItem>
                        <SelectItem value="dd/MM/yyyy">DD/MM/YYYY</SelectItem>
                        <SelectItem value="dd.MM.yyyy">DD.MM.YYYY</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Time Format */}
                  <div className="space-y-2">
                    <Label>Time Format</Label>
                    <Select
                      value={settings.general.timeFormat}
                      onValueChange={(value) =>
                        updateSettings("general.timeFormat", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="12h">12-hour (AM/PM)</SelectItem>
                        <SelectItem value="24h">24-hour</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Control when and how you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Enable Notifications */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Enable Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive reminder notifications
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.enabled}
                    onCheckedChange={(checked) =>
                      updateSettings("notifications.enabled", checked)
                    }
                  />
                </div>

                <Separator />

                {/* Sound Notifications */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Sound Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Play sounds with notifications
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.soundEnabled}
                    onCheckedChange={(checked) =>
                      updateSettings("notifications.soundEnabled", checked)
                    }
                    disabled={!settings.notifications.enabled}
                  />
                </div>

                {/* Vibration */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Vibration</Label>
                    <p className="text-sm text-muted-foreground">
                      Vibrate on mobile devices
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.vibrationEnabled}
                    onCheckedChange={(checked) =>
                      updateSettings("notifications.vibrationEnabled", checked)
                    }
                    disabled={!settings.notifications.enabled}
                  />
                </div>

                <Separator />

                {/* Quiet Hours */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Quiet Hours
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Disable notifications during specific hours
                      </p>
                    </div>
                    <Switch
                      checked={settings.notifications.quietHoursEnabled}
                      onCheckedChange={(checked) =>
                        updateSettings(
                          "notifications.quietHoursEnabled",
                          checked
                        )
                      }
                    />
                  </div>

                  {settings.notifications.quietHoursEnabled && (
                    <div className="grid grid-cols-2 gap-4 pl-6">
                      <div className="space-y-2">
                        <Label className="text-sm">Start Time</Label>
                        <Input
                          type="time"
                          value={settings.notifications.quietHoursStart}
                          onChange={(e) =>
                            updateSettings(
                              "notifications.quietHoursStart",
                              e.target.value
                            )
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">End Time</Label>
                        <Input
                          type="time"
                          value={settings.notifications.quietHoursEnd}
                          onChange={(e) =>
                            updateSettings(
                              "notifications.quietHoursEnd",
                              e.target.value
                            )
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-6">
            <ThemeToggle variant="card" showDescription />
          </TabsContent>

          {/* Sounds Tab */}
          <TabsContent value="sounds" className="space-y-6">
            <SoundSettings />
          </TabsContent>

          {/* Backup Tab */}
          <TabsContent value="backup" className="space-y-6">
            <BackupRestore />
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Privacy & Data
                </CardTitle>
                <CardDescription>
                  Control your data usage and privacy preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Analytics */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Usage Analytics</Label>
                    <p className="text-sm text-muted-foreground">
                      Help improve the app by sharing anonymous usage data
                    </p>
                  </div>
                  <Switch
                    checked={settings.privacy.analytics}
                    onCheckedChange={(checked) =>
                      updateSettings("privacy.analytics", checked)
                    }
                  />
                </div>

                <Separator />

                {/* Crash Reporting */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Crash Reporting</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically send crash reports to help fix issues
                    </p>
                  </div>
                  <Switch
                    checked={settings.privacy.crashReporting}
                    onCheckedChange={(checked) =>
                      updateSettings("privacy.crashReporting", checked)
                    }
                  />
                </div>

                <Separator />

                {/* Data Storage Notice */}
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    <Label className="text-sm font-medium">
                      Local Data Storage
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    All your data is stored locally on your device. We don't
                    have access to your personal information unless you
                    explicitly share it through feedback or support requests.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
