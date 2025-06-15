"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  Download,
  Upload,
  FileJson,
  Calendar,
  Settings,
  Database,
  Shield,
  CheckCircle,
  AlertCircle,
  Loader2,
  History,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  createBackup,
  downloadBackup,
  restoreFromBackup,
  validateBackupFile,
  getBackupHistory,
  clearBackupHistory,
  BackupOptions,
  RestoreOptions,
  BackupResult,
  RestoreResult,
} from "@/lib/backup";

export default function BackupRestore() {
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreProgress, setRestoreProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileValidation, setFileValidation] = useState<{
    valid: boolean;
    error?: string;
  } | null>(null);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [backupDialogOpen, setBackupDialogOpen] = useState(false);
  const [backupHistory, setBackupHistory] = useState(getBackupHistory());

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Backup options state
  const [backupOptions, setBackupOptions] = useState<BackupOptions>({
    includeReminders: true,
    includeCounters: true,
    includeSettings: true,
    includeLogs: false,
    dateRange: {
      from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      to: new Date(),
    },
  });

  // Restore options state
  const [restoreOptions, setRestoreOptions] = useState<RestoreOptions>({
    restoreReminders: true,
    restoreCounters: true,
    restoreSettings: true,
    restoreLogs: false,
    mergeMode: "merge",
  });

  // Create backup
  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);

    try {
      const result: BackupResult = await createBackup(backupOptions);

      if (result.success && result.data) {
        downloadBackup(result.data);
        setBackupHistory(getBackupHistory()); // Refresh history
        toast.success(result.message);
        setBackupDialogOpen(false);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Backup failed:", error);
      toast.error("Failed to create backup");
    } finally {
      setIsCreatingBackup(false);
    }
  };

  // Handle file selection for restore
  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);

    // Validate the backup file
    const validation = await validateBackupFile(file);
    setFileValidation(validation);

    if (validation.valid) {
      toast.success("Backup file is valid");
    } else {
      toast.error(validation.error || "Invalid backup file");
    }
  };

  // Restore from backup
  const handleRestore = async () => {
    if (!selectedFile || !fileValidation?.valid) {
      toast.error("Please select a valid backup file");
      return;
    }

    setIsRestoring(true);
    setRestoreProgress(0);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setRestoreProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const result: RestoreResult = await restoreFromBackup(
        selectedFile,
        restoreOptions
      );

      clearInterval(progressInterval);
      setRestoreProgress(100);

      if (result.success) {
        toast.success(result.message);
        setRestoreDialogOpen(false);

        // Reset form
        setSelectedFile(null);
        setFileValidation(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        toast.error(result.message);
        if (result.errors.length > 0) {
          result.errors.forEach((error) => toast.error(error));
        }
      }
    } catch (error) {
      console.error("Restore failed:", error);
      toast.error("Failed to restore backup");
    } finally {
      setIsRestoring(false);
      setRestoreProgress(0);
    }
  };

  // Clear backup history
  const handleClearHistory = () => {
    clearBackupHistory();
    setBackupHistory([]);
    toast.success("Backup history cleared");
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Backup Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Create Backup
          </CardTitle>
          <CardDescription>
            Export your data for safekeeping or transferring to another device
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium">Full Data Backup</p>
              <p className="text-sm text-muted-foreground">
                Includes reminders, counters, settings, and preferences
              </p>
            </div>

            <Dialog open={backupDialogOpen} onOpenChange={setBackupDialogOpen}>
              <DialogTrigger asChild>
                <Button disabled={isCreatingBackup}>
                  <Download className="h-4 w-4 mr-2" />
                  Create Backup
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create Backup</DialogTitle>
                  <DialogDescription>
                    Choose what data to include in your backup
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  {/* Data Types */}
                  <div className="grid gap-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="reminders"
                        checked={backupOptions.includeReminders}
                        onCheckedChange={(checked) =>
                          setBackupOptions((prev) => ({
                            ...prev,
                            includeReminders: !!checked,
                          }))
                        }
                      />
                      <Label
                        htmlFor="reminders"
                        className="flex items-center gap-2"
                      >
                        <Settings className="h-4 w-4" />
                        Reminders
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="counters"
                        checked={backupOptions.includeCounters}
                        onCheckedChange={(checked) =>
                          setBackupOptions((prev) => ({
                            ...prev,
                            includeCounters: !!checked,
                          }))
                        }
                      />
                      <Label
                        htmlFor="counters"
                        className="flex items-center gap-2"
                      >
                        <Database className="h-4 w-4" />
                        Counters
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="settings"
                        checked={backupOptions.includeSettings}
                        onCheckedChange={(checked) =>
                          setBackupOptions((prev) => ({
                            ...prev,
                            includeSettings: !!checked,
                          }))
                        }
                      />
                      <Label
                        htmlFor="settings"
                        className="flex items-center gap-2"
                      >
                        <Settings className="h-4 w-4" />
                        Settings & Preferences
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="logs"
                        checked={backupOptions.includeLogs}
                        onCheckedChange={(checked) =>
                          setBackupOptions((prev) => ({
                            ...prev,
                            includeLogs: !!checked,
                          }))
                        }
                      />
                      <Label htmlFor="logs" className="flex items-center gap-2">
                        <History className="h-4 w-4" />
                        Activity Logs (Last 30 days)
                      </Label>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setBackupDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateBackup}
                    disabled={isCreatingBackup}
                  >
                    {isCreatingBackup ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Create Backup
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Restore Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Restore from Backup
          </CardTitle>
          <CardDescription>
            Import your data from a previously created backup file
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* File Selection */}
            <div className="space-y-2">
              <Label>Select Backup File</Label>
              <div className="flex items-center gap-3">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  className="flex-1"
                />
                {selectedFile && fileValidation && (
                  <div className="flex items-center gap-2">
                    {fileValidation.valid ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-destructive" />
                    )}
                  </div>
                )}
              </div>

              {selectedFile && (
                <div className="text-sm text-muted-foreground">
                  Selected: {selectedFile.name} (
                  {formatFileSize(selectedFile.size)})
                </div>
              )}

              {fileValidation && !fileValidation.valid && (
                <div className="text-sm text-destructive">
                  {fileValidation.error}
                </div>
              )}
            </div>

            {/* Restore Button */}
            <Dialog
              open={restoreDialogOpen}
              onOpenChange={setRestoreDialogOpen}
            >
              <DialogTrigger asChild>
                <Button
                  disabled={
                    !selectedFile || !fileValidation?.valid || isRestoring
                  }
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Restore from Backup
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Restore from Backup</DialogTitle>
                  <DialogDescription>
                    Choose what data to restore and how to handle conflicts
                  </DialogDescription>
                </DialogHeader>

                {isRestoring ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin" />
                      <p className="font-medium">Restoring data...</p>
                      <p className="text-sm text-muted-foreground">
                        Please don't close this window
                      </p>
                    </div>
                    <Progress value={restoreProgress} className="w-full" />
                    <p className="text-xs text-center text-muted-foreground">
                      {restoreProgress}% complete
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Restore Options */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">
                        Data to Restore
                      </Label>

                      <div className="grid gap-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="restore-reminders"
                            checked={restoreOptions.restoreReminders}
                            onCheckedChange={(checked) =>
                              setRestoreOptions((prev) => ({
                                ...prev,
                                restoreReminders: !!checked,
                              }))
                            }
                          />
                          <Label htmlFor="restore-reminders">Reminders</Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="restore-counters"
                            checked={restoreOptions.restoreCounters}
                            onCheckedChange={(checked) =>
                              setRestoreOptions((prev) => ({
                                ...prev,
                                restoreCounters: !!checked,
                              }))
                            }
                          />
                          <Label htmlFor="restore-counters">Counters</Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="restore-settings"
                            checked={restoreOptions.restoreSettings}
                            onCheckedChange={(checked) =>
                              setRestoreOptions((prev) => ({
                                ...prev,
                                restoreSettings: !!checked,
                              }))
                            }
                          />
                          <Label htmlFor="restore-settings">Settings</Label>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Merge Mode */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        Conflict Resolution
                      </Label>
                      <Select
                        value={restoreOptions.mergeMode}
                        onValueChange={(value: any) =>
                          setRestoreOptions((prev) => ({
                            ...prev,
                            mergeMode: value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="merge">
                            Merge - Add new items, keep existing
                          </SelectItem>
                          <SelectItem value="replace">
                            Replace - Overwrite existing items
                          </SelectItem>
                          <SelectItem value="skip-existing">
                            Skip - Only add new items
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {!isRestoring && (
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setRestoreDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleRestore}>
                      <Upload className="h-4 w-4 mr-2" />
                      Start Restore
                    </Button>
                  </DialogFooter>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Backup History */}
      {backupHistory.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Backup History
                </CardTitle>
                <CardDescription>Recent backup operations</CardDescription>
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear History
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear Backup History</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove the backup history records. The actual
                      backup files on your device will not be affected.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearHistory}>
                      Clear History
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {backupHistory.map((backup: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <FileJson className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {formatDate(backup.timestamp)}
                      </p>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <span>{backup.metadata.totalReminders} reminders</span>
                        <span>•</span>
                        <span>{backup.metadata.totalCounters} counters</span>
                        <span>•</span>
                        <span>{formatFileSize(backup.size)}</span>
                      </div>
                    </div>
                  </div>

                  <Badge variant="outline">
                    {backup.metadata.activeReminders} active
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Important Notice */}
      <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium text-amber-900 dark:text-amber-100">
                Important Security Notes
              </p>
              <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-1">
                <li>• Backup files contain all your personal data</li>
                <li>• Store backup files securely and never share them</li>
                <li>• Restoring will modify your current data</li>
                <li>• Consider creating a backup before restoring</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
