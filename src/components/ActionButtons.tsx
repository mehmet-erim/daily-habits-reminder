"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CheckCircle2,
  XCircle,
  Timer,
  ChevronDown,
  Loader2,
  WifiOff,
} from "lucide-react";
import { useLogging } from "@/hooks/useLogging";

export interface ActionButtonsProps {
  reminderId: string;
  onActionComplete?: (action: "completed" | "dismissed" | "snoozed") => void;
  disabled?: boolean;
  size?: "sm" | "default" | "lg";
  variant?: "default" | "outline" | "ghost";
  showLabels?: boolean;
  allowSnooze?: boolean;
  maxSnoozes?: number;
  currentSnoozeCount?: number;
  snoozeOptions?: number[]; // minutes
  className?: string;
}

const DEFAULT_SNOOZE_OPTIONS = [5, 10, 15, 30]; // minutes

export function ActionButtons({
  reminderId,
  onActionComplete,
  disabled = false,
  size = "sm",
  variant = "outline",
  showLabels = true,
  allowSnooze = true,
  maxSnoozes = 3,
  currentSnoozeCount = 0,
  snoozeOptions = DEFAULT_SNOOZE_OPTIONS,
  className = "",
}: ActionButtonsProps) {
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const { logAction, isLogging, isOnline, offlineLogsCount } = useLogging();

  const canSnooze = allowSnooze && currentSnoozeCount < maxSnoozes;

  const handleAction = async (
    action: "completed" | "dismissed" | "snoozed",
    snoozeMinutes?: number
  ) => {
    if (disabled || isLogging) return;

    setIsProcessing(action);

    try {
      const options: any = {};

      if (action === "snoozed" && snoozeMinutes) {
        options.snoozeMinutes = snoozeMinutes;
        options.currentSnoozeCount = currentSnoozeCount;
      }

      const result = await logAction(reminderId, action, options);

      if (result.success) {
        onActionComplete?.(action);
      } else {
        console.error(`Failed to log ${action}:`, result.error);
        // Still call onActionComplete for optimistic UI updates
        onActionComplete?.(action);
      }
    } catch (error) {
      console.error(`Error handling ${action}:`, error);
      // Still call onActionComplete for optimistic UI updates
      onActionComplete?.(action);
    } finally {
      setIsProcessing(null);
    }
  };

  const getButtonContent = (
    action: string,
    icon: React.ReactNode,
    label: string
  ) => {
    const isActive = isProcessing === action;

    return (
      <>
        {isActive ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : icon}
        {showLabels && <span className="ml-1">{label}</span>}
      </>
    );
  };

  return (
    <TooltipProvider>
      <div className={`flex gap-2 ${className}`}>
        {/* Completed Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size={size}
              variant={variant}
              onClick={() => handleAction("completed")}
              disabled={disabled || isProcessing !== null}
              className="bg-green-400/10 text-green-400 hover:bg-green-400/20 border-green-400/20"
            >
              {getButtonContent(
                "completed",
                <CheckCircle2 className="h-4 w-4" />,
                "Done"
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Mark as completed</p>
          </TooltipContent>
        </Tooltip>

        {/* Dismissed Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size={size}
              variant={variant}
              onClick={() => handleAction("dismissed")}
              disabled={disabled || isProcessing !== null}
              className="bg-red-400/10 text-red-400 hover:bg-red-400/20 border-red-400/20"
            >
              {getButtonContent(
                "dismissed",
                <XCircle className="h-4 w-4" />,
                "Skip"
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Dismiss reminder</p>
          </TooltipContent>
        </Tooltip>

        {/* Snooze Button */}
        {canSnooze && (
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    size={size}
                    variant={variant}
                    disabled={disabled || isProcessing !== null}
                    className="bg-yellow-400/10 text-yellow-400 hover:bg-yellow-400/20 border-yellow-400/20"
                  >
                    {getButtonContent(
                      "snoozed",
                      <Timer className="h-4 w-4" />,
                      "Snooze"
                    )}
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Snooze reminder</p>
              </TooltipContent>
            </Tooltip>

            <DropdownMenuContent align="end">
              {snoozeOptions.map((minutes) => (
                <DropdownMenuItem
                  key={minutes}
                  onClick={() => handleAction("snoozed", minutes)}
                  disabled={disabled || isProcessing !== null}
                >
                  <Timer className="h-4 w-4 mr-2" />
                  {minutes} minute{minutes > 1 ? "s" : ""}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Snooze limit reached indicator */}
        {!canSnooze && allowSnooze && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className="text-yellow-400 border-yellow-400/20"
              >
                Max snoozes
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Maximum snooze limit reached ({maxSnoozes})</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Offline indicator */}
        {!isOnline && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className="text-orange-400 border-orange-400/20"
              >
                <WifiOff className="h-3 w-3 mr-1" />
                Offline
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Working offline - actions will sync when connected</p>
              {offlineLogsCount > 0 && (
                <p className="text-xs mt-1">
                  {offlineLogsCount} actions pending sync
                </p>
              )}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}

// Compact version for mobile or tight spaces
export function CompactActionButtons({
  reminderId,
  onActionComplete,
  disabled = false,
  currentSnoozeCount = 0,
  maxSnoozes = 3,
}: Pick<
  ActionButtonsProps,
  | "reminderId"
  | "onActionComplete"
  | "disabled"
  | "currentSnoozeCount"
  | "maxSnoozes"
>) {
  return (
    <ActionButtons
      reminderId={reminderId}
      onActionComplete={onActionComplete}
      disabled={disabled}
      size="sm"
      variant="ghost"
      showLabels={false}
      currentSnoozeCount={currentSnoozeCount}
      maxSnoozes={maxSnoozes}
      className="gap-1"
    />
  );
}

// Action buttons with status display
export interface ActionButtonsWithStatusProps extends ActionButtonsProps {
  status: "pending" | "completed" | "dismissed" | "snoozed";
  timestamp?: Date;
}

export function ActionButtonsWithStatus({
  status,
  timestamp,
  currentSnoozeCount = 0,
  ...props
}: ActionButtonsWithStatusProps) {
  const getStatusBadge = () => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-400/10 text-green-400 border-green-400/20">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case "dismissed":
        return (
          <Badge className="bg-red-400/10 text-red-400 border-red-400/20">
            <XCircle className="h-3 w-3 mr-1" />
            Dismissed
          </Badge>
        );
      case "snoozed":
        return (
          <Badge className="bg-yellow-400/10 text-yellow-400 border-yellow-400/20">
            <Timer className="h-3 w-3 mr-1" />
            Snoozed {currentSnoozeCount > 1 ? `(${currentSnoozeCount}x)` : ""}
          </Badge>
        );
      default:
        return null;
    }
  };

  if (status !== "pending") {
    return (
      <div className="flex items-center gap-2">
        {getStatusBadge()}
        {timestamp && (
          <span className="text-xs text-muted-foreground">
            {timestamp.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        )}
      </div>
    );
  }

  return <ActionButtons {...props} currentSnoozeCount={currentSnoozeCount} />;
}
