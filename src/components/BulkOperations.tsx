"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Settings,
  Download,
  Upload,
  Trash2,
  Play,
  Pause,
  Copy,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileText,
  X,
} from "lucide-react";
import {
  BULK_OPERATIONS,
  getBulkUpdateData,
  executeBulkUpdate,
  executeBulkDelete,
  executeBulkDuplicate,
  executeBulkExport,
  executeBulkImport,
  downloadExportData,
  importRemindersFromFile,
  BulkOperationResult,
  BulkOperation,
} from "@/lib/bulk-operations";
import { toast } from "sonner";

interface BulkOperationsProps {
  selectedReminders: string[];
  allReminders: any[];
  onSelectionChange: (selectedIds: string[]) => void;
  onOperationComplete: () => void;
  onClearSelection: () => void;
}

export default function BulkOperations({
  selectedReminders,
  allReminders,
  onSelectionChange,
  onOperationComplete,
  onClearSelection,
}: BulkOperationsProps) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionProgress, setExecutionProgress] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedOperation, setSelectedOperation] =
    useState<BulkOperation | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [quietHoursStart, setQuietHoursStart] = useState("22:00");
  const [quietHoursEnd, setQuietHoursEnd] = useState("07:00");
  const checkboxRef = useRef<HTMLButtonElement>(null);

  const isAllSelected =
    selectedReminders.length === allReminders.length && allReminders.length > 0;
  const isIndeterminate =
    selectedReminders.length > 0 &&
    selectedReminders.length < allReminders.length;

  useEffect(() => {
    if (checkboxRef.current) {
      const inputElement = checkboxRef.current.querySelector(
        'input[type="checkbox"]'
      ) as HTMLInputElement;
      if (inputElement) {
        inputElement.indeterminate = isIndeterminate;
      }
    }
  }, [isIndeterminate]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(allReminders.map((r) => r.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleOperationSelect = (operation: BulkOperation) => {
    setSelectedOperation(operation);
    if (operation.requiresConfirmation) {
      setShowConfirmDialog(true);
    } else {
      executeOperation(operation);
    }
  };

  const executeOperation = async (operation: BulkOperation) => {
    if (selectedReminders.length === 0) {
      toast.error("Please select at least one reminder");
      return;
    }

    setIsExecuting(true);
    setExecutionProgress(0);

    try {
      let result: BulkOperationResult | null = null;

      switch (operation.action) {
        case "update":
          const updateData = getBulkUpdateData(operation.id);
          if (updateData) {
            // Handle special case for quiet hours
            if (operation.id === "set-quiet-hours") {
              updateData.quietHoursStart = quietHoursStart;
              updateData.quietHoursEnd = quietHoursEnd;
            }
            result = await executeBulkUpdate(selectedReminders, updateData);
          }
          break;

        case "delete":
          result = await executeBulkDelete(selectedReminders);
          break;

        case "duplicate":
          result = await executeBulkDuplicate(selectedReminders);
          break;

        case "export":
          const exportResult = await executeBulkExport(selectedReminders);
          if (exportResult.success && exportResult.data) {
            downloadExportData(exportResult.data);
            toast.success(exportResult.message);
          } else {
            toast.error(exportResult.message);
          }
          break;
      }

      if (result) {
        if (result.success) {
          toast.success(result.message);
        } else {
          toast.error(result.message);
          if (result.errors.length > 0) {
            console.error("Bulk operation errors:", result.errors);
          }
        }
      }

      setExecutionProgress(100);
      onOperationComplete();
      onClearSelection();
    } catch (error) {
      console.error("Bulk operation error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsExecuting(false);
      setShowConfirmDialog(false);
      setSelectedOperation(null);
    }
  };

  const handleImport = async (file: File) => {
    try {
      setIsExecuting(true);
      const reminders = await importRemindersFromFile(file);
      const result = await executeBulkImport(reminders);

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }

      onOperationComplete();
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Failed to import reminders");
    } finally {
      setIsExecuting(false);
      setImportDialogOpen(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Selection Controls */}
      <div className="flex items-center justify-between bg-card rounded-lg p-4 border">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={isAllSelected}
              ref={checkboxRef}
              onCheckedChange={handleSelectAll}
            />
            <Label className="text-sm font-medium">
              Select All ({selectedReminders.length} of {allReminders.length})
            </Label>
          </div>

          {selectedReminders.length > 0 && (
            <Badge variant="secondary">
              {selectedReminders.length} selected
            </Badge>
          )}
        </div>

        {selectedReminders.length > 0 && (
          <Button variant="ghost" size="sm" onClick={onClearSelection}>
            <X className="h-4 w-4 mr-2" />
            Clear Selection
          </Button>
        )}
      </div>

      {/* Bulk Operations */}
      {selectedReminders.length > 0 && (
        <div className="bg-card rounded-lg p-4 border space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Bulk Operations
            </h3>
            <Badge variant="outline">
              {selectedReminders.length} reminder
              {selectedReminders.length !== 1 ? "s" : ""} selected
            </Badge>
          </div>

          <Separator />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {BULK_OPERATIONS.map((operation) => (
              <Button
                key={operation.id}
                variant="outline"
                size="sm"
                onClick={() => handleOperationSelect(operation)}
                disabled={isExecuting}
                className="flex items-center gap-2 text-left justify-start"
              >
                <span className="text-lg">{operation.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">
                    {operation.label}
                  </p>
                </div>
              </Button>
            ))}

            {/* Import Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setImportDialogOpen(true)}
              disabled={isExecuting}
              className="flex items-center gap-2 text-left justify-start"
            >
              <Upload className="h-4 w-4" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">Import</p>
              </div>
            </Button>
          </div>

          {/* Progress Bar */}
          {isExecuting && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Executing operation...</span>
              </div>
              <Progress value={executionProgress} className="w-full" />
            </div>
          )}
        </div>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Confirm Operation
            </DialogTitle>
            <DialogDescription>
              {selectedOperation && (
                <>
                  Are you sure you want to{" "}
                  <strong>{selectedOperation.label.toLowerCase()}</strong> on{" "}
                  <strong>{selectedReminders.length}</strong> reminder
                  {selectedReminders.length !== 1 ? "s" : ""}?
                  <br />
                  <br />
                  {selectedOperation.description}
                  {selectedOperation.id === "delete" && (
                    <div className="mt-2 p-2 bg-destructive/10 rounded text-sm text-destructive">
                      ⚠️ This action cannot be undone.
                    </div>
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {/* Special inputs for quiet hours */}
          {selectedOperation?.id === "set-quiet-hours" && (
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <Label htmlFor="quiet-start">Start Time</Label>
                <Input
                  id="quiet-start"
                  type="time"
                  value={quietHoursStart}
                  onChange={(e) => setQuietHoursStart(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="quiet-end">End Time</Label>
                <Input
                  id="quiet-end"
                  type="time"
                  value={quietHoursEnd}
                  onChange={(e) => setQuietHoursEnd(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={isExecuting}
            >
              Cancel
            </Button>
            <Button
              variant={
                selectedOperation?.id === "delete" ? "destructive" : "default"
              }
              onClick={() =>
                selectedOperation && executeOperation(selectedOperation)
              }
              disabled={isExecuting}
            >
              {isExecuting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirm
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Import Reminders
            </DialogTitle>
            <DialogDescription>
              Select a JSON file containing exported reminders to import.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                Drag and drop a JSON file here, or click to select
              </p>
              <Input
                type="file"
                accept=".json"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleImport(file);
                  }
                }}
                className="cursor-pointer"
              />
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p>
                • Only JSON files exported from this application are supported
              </p>
              <p>
                • Imported reminders will be added to your existing reminders
              </p>
              <p>
                • Duplicate reminders may be created if importing the same file
                multiple times
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setImportDialogOpen(false)}
              disabled={isExecuting}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
