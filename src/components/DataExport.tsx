"use client";

import { useState } from "react";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Calendar as CalendarIcon,
  Download,
  FileText,
  Database,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  HistoricalDayData,
  exportToCSV,
  exportToJSON,
  getSummaryStats,
} from "@/lib/data-utils";

interface DataExportProps {
  userId: string;
  availableDateRange?: {
    startDate: string | null;
    endDate: string | null;
    totalDays: number;
  };
  className?: string;
}

type ExportFormat = "csv" | "json";
type DateRange =
  | "last7days"
  | "last30days"
  | "thisMonth"
  | "lastMonth"
  | "all"
  | "custom";

interface ExportSummary {
  totalDays: number;
  totalScheduled: number;
  totalCompleted: number;
  overallCompletionRate: number;
}

export function DataExport({
  userId,
  availableDateRange,
  className,
}: DataExportProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("csv");
  const [selectedRange, setSelectedRange] = useState<DateRange>("last30days");
  const [exportSummary, setExportSummary] = useState<ExportSummary | null>(
    null
  );

  const getDateRangeForSelection = (
    range: DateRange
  ): { startDate: string; endDate: string } => {
    const today = new Date();
    const todayString = format(today, "yyyy-MM-dd");

    switch (range) {
      case "last7days":
        return {
          startDate: format(subDays(today, 6), "yyyy-MM-dd"),
          endDate: todayString,
        };
      case "last30days":
        return {
          startDate: format(subDays(today, 29), "yyyy-MM-dd"),
          endDate: todayString,
        };
      case "thisMonth":
        return {
          startDate: format(startOfMonth(today), "yyyy-MM-dd"),
          endDate: format(endOfMonth(today), "yyyy-MM-dd"),
        };
      case "lastMonth":
        const lastMonth = new Date(
          today.getFullYear(),
          today.getMonth() - 1,
          1
        );
        return {
          startDate: format(startOfMonth(lastMonth), "yyyy-MM-dd"),
          endDate: format(endOfMonth(lastMonth), "yyyy-MM-dd"),
        };
      case "all":
        return {
          startDate:
            availableDateRange?.startDate ||
            format(subDays(today, 365), "yyyy-MM-dd"),
          endDate: availableDateRange?.endDate || todayString,
        };
      default:
        return {
          startDate: format(subDays(today, 29), "yyyy-MM-dd"),
          endDate: todayString,
        };
    }
  };

  const downloadFile = (
    content: string,
    filename: string,
    mimeType: string
  ) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const { startDate, endDate } = getDateRangeForSelection(selectedRange);

      // Fetch the data from our API
      const response = await fetch(
        `/api/history/range?startDate=${startDate}&endDate=${endDate}&userId=${userId}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch historical data");
      }

      const data: HistoricalDayData[] = await response.json();

      // Generate export content
      let content: string;
      let filename: string;
      let mimeType: string;

      if (selectedFormat === "csv") {
        content = exportToCSV(data);
        filename = `wellness-data-${startDate}-to-${endDate}.csv`;
        mimeType = "text/csv";
      } else {
        content = exportToJSON(data);
        filename = `wellness-data-${startDate}-to-${endDate}.json`;
        mimeType = "application/json";
      }

      // Calculate summary stats
      const summary = await getSummaryStats(userId, startDate, endDate);
      setExportSummary({
        totalDays: data.length,
        totalScheduled: summary.totalScheduled,
        totalCompleted: summary.totalCompleted,
        overallCompletionRate: summary.overallCompletionRate,
      });

      // Download the file
      downloadFile(content, filename, mimeType);
    } catch (error) {
      console.error("Export failed:", error);
      // You might want to show a toast or error message here
    } finally {
      setIsExporting(false);
    }
  };

  const getFormatDescription = (format: ExportFormat) => {
    switch (format) {
      case "csv":
        return "Comma-separated values file, perfect for Excel or Google Sheets";
      case "json":
        return "JSON format, ideal for developers and data analysis tools";
    }
  };

  const getRangeDescription = (range: DateRange) => {
    const { startDate, endDate } = getDateRangeForSelection(range);
    switch (range) {
      case "last7days":
        return "Last 7 days of data";
      case "last30days":
        return "Last 30 days of data";
      case "thisMonth":
        return `This month (${format(new Date(startDate), "MMM d")} - ${format(
          new Date(endDate),
          "MMM d"
        )})`;
      case "lastMonth":
        return `Last month (${format(new Date(startDate), "MMM d")} - ${format(
          new Date(endDate),
          "MMM d"
        )})`;
      case "all":
        return `All available data (${
          availableDateRange?.totalDays || 0
        } days)`;
      default:
        return "";
    }
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Download className="h-5 w-5 text-muted-foreground" />
          Export Data
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Download your wellness tracking data for backup or analysis
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Format Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground">
            Export Format
          </label>
          <Select
            value={selectedFormat}
            onValueChange={(value: ExportFormat) => setSelectedFormat(value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>CSV File</span>
                </div>
              </SelectItem>
              <SelectItem value="json">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  <span>JSON File</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {getFormatDescription(selectedFormat)}
          </p>
        </div>

        <Separator />

        {/* Date Range Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground">
            Date Range
          </label>
          <Select
            value={selectedRange}
            onValueChange={(value: DateRange) => setSelectedRange(value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last7days">Last 7 days</SelectItem>
              <SelectItem value="last30days">Last 30 days</SelectItem>
              <SelectItem value="thisMonth">This month</SelectItem>
              <SelectItem value="lastMonth">Last month</SelectItem>
              {availableDateRange?.totalDays &&
                availableDateRange.totalDays > 0 && (
                  <SelectItem value="all">All data</SelectItem>
                )}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {getRangeDescription(selectedRange)}
          </p>
        </div>

        <Separator />

        {/* Export Summary */}
        {exportSummary && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-foreground">
              Last Export Summary
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 p-3 bg-blue-400/5 border border-blue-400/10 rounded-lg">
                <CalendarIcon className="h-4 w-4 text-blue-400" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {exportSummary.totalDays}
                  </p>
                  <p className="text-xs text-muted-foreground">Days exported</p>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-green-400/5 border border-green-400/10 rounded-lg">
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {exportSummary.overallCompletionRate.toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Completion rate
                  </p>
                </div>
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              Total reminders: {exportSummary.totalScheduled} • Completed:{" "}
              {exportSummary.totalCompleted}
            </div>
          </div>
        )}

        {/* Available Data Info */}
        {availableDateRange && availableDateRange.totalDays > 0 && (
          <div className="p-3 bg-muted/5 border border-border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                Available Data
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2 text-xs text-muted-foreground">
              <div>
                <span>Date range: </span>
                <span className="font-medium">
                  {availableDateRange.startDate &&
                    format(
                      new Date(availableDateRange.startDate),
                      "MMM d, yyyy"
                    )}{" "}
                  -{" "}
                  {availableDateRange.endDate &&
                    format(new Date(availableDateRange.endDate), "MMM d, yyyy")}
                </span>
              </div>
              <div>
                <span>Total days with data: </span>
                <Badge variant="outline" className="text-xs">
                  {availableDateRange.totalDays}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Export Button */}
        <Button
          onClick={handleExport}
          disabled={isExporting}
          className="w-full"
          size="lg"
        >
          {isExporting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Preparing Export...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Export {selectedFormat.toUpperCase()} File
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Your data will be downloaded directly to your device. No information
          is sent to external servers.
        </p>
      </CardContent>
    </Card>
  );
}
