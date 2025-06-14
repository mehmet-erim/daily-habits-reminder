"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  X,
  CheckCircle2,
  XCircle,
  Timer,
  Bell,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useTimer } from "@/hooks/useTimer";

export interface NotificationPopupProps {
  id: string;
  title: string;
  description?: string;
  category?: string;
  reminderId: string;
  isVisible: boolean;
  autoCloseAfter?: number; // seconds
  soundEnabled?: boolean;
  onAction: (action: "completed" | "dismissed" | "snoozed") => void;
  onClose: () => void;
  onSnooze?: (minutes: number) => void;
  maxSnoozes?: number;
  currentSnoozeCount?: number;
}

const SNOOZE_OPTIONS = [5, 10, 15, 30]; // minutes

export function NotificationPopup({
  id,
  title,
  description,
  category = "wellness",
  reminderId,
  isVisible,
  autoCloseAfter = 60, // Auto-close after 60 seconds by default
  soundEnabled = true,
  onAction,
  onClose,
  onSnooze,
  maxSnoozes = 3,
  currentSnoozeCount = 0,
}: NotificationPopupProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [selectedSnoozeMinutes, setSelectedSnoozeMinutes] = useState(
    SNOOZE_OPTIONS[0]
  );
  const { timerState, startTimer, stopTimer, formatTime, getProgress } =
    useTimer();

  // Auto-close timer
  useEffect(() => {
    if (isVisible && autoCloseAfter > 0) {
      startTimer(autoCloseAfter, () => {
        handleAction("dismissed");
      });
    }

    return () => {
      stopTimer();
    };
  }, [isVisible, autoCloseAfter, startTimer, stopTimer]);

  const handleAction = async (
    action: "completed" | "dismissed" | "snoozed"
  ) => {
    setIsClosing(true);

    try {
      if (action === "snoozed" && onSnooze) {
        onSnooze(selectedSnoozeMinutes);
      }

      onAction(action);
    } finally {
      // Small delay for animation
      setTimeout(() => {
        onClose();
        setIsClosing(false);
      }, 200);
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    stopTimer();

    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 200);
  };

  const getCategoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      wellness: "text-blue-400 bg-blue-400/10 border-blue-400/20",
      health: "text-green-400 bg-green-400/10 border-green-400/20",
      exercise: "text-orange-400 bg-orange-400/10 border-orange-400/20",
      nutrition: "text-purple-400 bg-purple-400/10 border-purple-400/20",
      mindfulness: "text-indigo-400 bg-indigo-400/10 border-indigo-400/20",
      default: "text-muted-foreground bg-muted/10 border-border",
    };
    return colors[cat] || colors.default;
  };

  const canSnooze = currentSnoozeCount < maxSnoozes;

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm w-full">
      <Card
        className={`
          bg-card border-border shadow-lg transition-all duration-200 ease-in-out
          ${
            isClosing
              ? "transform translate-x-full opacity-0"
              : "transform translate-x-0 opacity-100"
          }
        `}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg font-semibold text-foreground">
                {title}
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {soundEnabled ? (
                <Volume2 className="h-4 w-4 text-muted-foreground" />
              ) : (
                <VolumeX className="h-4 w-4 text-muted-foreground" />
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <Badge className={getCategoryColor(category)}>{category}</Badge>
            {currentSnoozeCount > 0 && (
              <Badge
                variant="outline"
                className="text-yellow-400 border-yellow-400/20"
              >
                Snoozed {currentSnoozeCount}x
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {description && (
            <p className="text-sm text-muted-foreground mb-4">{description}</p>
          )}

          {/* Auto-close progress bar */}
          {autoCloseAfter > 0 && timerState.isActive && (
            <div className="mb-4">
              <p className="text-xs text-muted-foreground mb-2">
                Auto-closing in {formatTime(timerState.timeRemaining)}
              </p>
              <Progress value={getProgress()} className="h-1" />
            </div>
          )}

          {/* Snooze options */}
          {canSnooze && (
            <div className="mb-4">
              <p className="text-xs text-muted-foreground mb-2">Snooze for:</p>
              <div className="flex gap-1">
                {SNOOZE_OPTIONS.map((minutes) => (
                  <Button
                    key={minutes}
                    variant={
                      selectedSnoozeMinutes === minutes ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setSelectedSnoozeMinutes(minutes)}
                    className="flex-1 text-xs h-7"
                  >
                    {minutes}m
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => handleAction("completed")}
              className="flex-1 bg-green-400/10 text-green-400 hover:bg-green-400/20 border-green-400/20"
              variant="outline"
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Done
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAction("dismissed")}
              className="flex-1 bg-red-400/10 text-red-400 hover:bg-red-400/20 border-red-400/20"
            >
              <XCircle className="h-4 w-4 mr-1" />
              Skip
            </Button>

            {canSnooze && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAction("snoozed")}
                className="flex-1 bg-yellow-400/10 text-yellow-400 hover:bg-yellow-400/20 border-yellow-400/20"
              >
                <Timer className="h-4 w-4 mr-1" />
                Snooze
              </Button>
            )}
          </div>

          {!canSnooze && maxSnoozes > 0 && (
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Maximum snooze limit reached ({maxSnoozes})
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Notification manager component for handling multiple notifications
export interface NotificationItem {
  id: string;
  title: string;
  description?: string;
  category?: string;
  reminderId: string;
  timestamp: Date;
  autoCloseAfter?: number;
  soundEnabled?: boolean;
  maxSnoozes?: number;
  currentSnoozeCount?: number;
}

export interface NotificationManagerProps {
  notifications: NotificationItem[];
  onAction: (
    notificationId: string,
    action: "completed" | "dismissed" | "snoozed"
  ) => void;
  onSnooze: (notificationId: string, minutes: number) => void;
  onClose: (notificationId: string) => void;
}

export function NotificationManager({
  notifications,
  onAction,
  onSnooze,
  onClose,
}: NotificationManagerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {notifications.map((notification, index) => (
        <div
          key={notification.id}
          style={{
            transform: `translateY(${index * 10}px)`,
            zIndex: 50 - index,
          }}
        >
          <NotificationPopup
            {...notification}
            isVisible={true}
            onAction={(action) => onAction(notification.id, action)}
            onSnooze={(minutes) => onSnooze(notification.id, minutes)}
            onClose={() => onClose(notification.id)}
          />
        </div>
      ))}
    </div>
  );
}
