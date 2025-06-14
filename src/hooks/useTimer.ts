"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface TimerState {
  isActive: boolean;
  timeRemaining: number;
  totalTime: number;
}

export interface UseTimerReturn {
  // Timer state
  timerState: TimerState;

  // Actions
  startTimer: (durationInSeconds: number, onComplete?: () => void) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => void;
  resetTimer: () => void;

  // Utilities
  formatTime: (seconds: number) => string;
  getProgress: () => number;
}

export interface UseReminderTimerReturn extends UseTimerReturn {
  // Reminder-specific actions
  startReminderTimer: (reminderTime: string, onTrigger: () => void) => void;
  startSnoozeTimer: (snoozeMinutes: number, onTrigger: () => void) => void;

  // State
  nextReminderTime: Date | null;
  isWaitingForReminder: boolean;
}

export function useTimer(): UseTimerReturn {
  const [timerState, setTimerState] = useState<TimerState>({
    isActive: false,
    timeRemaining: 0,
    totalTime: 0,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const onCompleteRef = useRef<(() => void) | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startTimer = useCallback(
    (durationInSeconds: number, onComplete?: () => void) => {
      clearTimer();

      if (onComplete) {
        onCompleteRef.current = onComplete;
      }

      setTimerState({
        isActive: true,
        timeRemaining: durationInSeconds,
        totalTime: durationInSeconds,
      });

      intervalRef.current = setInterval(() => {
        setTimerState((current) => {
          if (current.timeRemaining <= 1) {
            clearTimer();
            if (onCompleteRef.current) {
              onCompleteRef.current();
              onCompleteRef.current = null;
            }
            return {
              ...current,
              isActive: false,
              timeRemaining: 0,
            };
          }

          return {
            ...current,
            timeRemaining: current.timeRemaining - 1,
          };
        });
      }, 1000);
    },
    [clearTimer]
  );

  const pauseTimer = useCallback(() => {
    clearTimer();
    setTimerState((current) => ({ ...current, isActive: false }));
  }, [clearTimer]);

  const resumeTimer = useCallback(() => {
    if (timerState.timeRemaining > 0) {
      startTimer(timerState.timeRemaining, onCompleteRef.current || undefined);
    }
  }, [timerState.timeRemaining, startTimer]);

  const stopTimer = useCallback(() => {
    clearTimer();
    setTimerState({
      isActive: false,
      timeRemaining: 0,
      totalTime: 0,
    });
    onCompleteRef.current = null;
  }, [clearTimer]);

  const resetTimer = useCallback(() => {
    clearTimer();
    setTimerState((current) => ({
      isActive: false,
      timeRemaining: current.totalTime,
      totalTime: current.totalTime,
    }));
  }, [clearTimer]);

  const formatTime = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
    }

    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  }, []);

  const getProgress = useCallback((): number => {
    if (timerState.totalTime === 0) return 0;
    return (
      ((timerState.totalTime - timerState.timeRemaining) /
        timerState.totalTime) *
      100
    );
  }, [timerState.totalTime, timerState.timeRemaining]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, [clearTimer]);

  return {
    timerState,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    resetTimer,
    formatTime,
    getProgress,
  };
}

export function useReminderTimer(): UseReminderTimerReturn {
  const timer = useTimer();
  const [nextReminderTime, setNextReminderTime] = useState<Date | null>(null);
  const [isWaitingForReminder, setIsWaitingForReminder] = useState(false);

  const calculateSecondsUntilTime = useCallback(
    (timeString: string): number => {
      const now = new Date();
      const [hours, minutes] = timeString.split(":").map(Number);

      const targetTime = new Date();
      targetTime.setHours(hours, minutes, 0, 0);

      // If target time is in the past today, set it for tomorrow
      if (targetTime <= now) {
        targetTime.setDate(targetTime.getDate() + 1);
      }

      return Math.floor((targetTime.getTime() - now.getTime()) / 1000);
    },
    []
  );

  const startReminderTimer = useCallback(
    (reminderTime: string, onTrigger: () => void) => {
      const secondsUntilReminder = calculateSecondsUntilTime(reminderTime);
      const targetTime = new Date(Date.now() + secondsUntilReminder * 1000);

      setNextReminderTime(targetTime);
      setIsWaitingForReminder(true);

      timer.startTimer(secondsUntilReminder, () => {
        setIsWaitingForReminder(false);
        setNextReminderTime(null);
        onTrigger();
      });
    },
    [calculateSecondsUntilTime, timer]
  );

  const startSnoozeTimer = useCallback(
    (snoozeMinutes: number, onTrigger: () => void) => {
      const snoozeSeconds = snoozeMinutes * 60;
      const targetTime = new Date(Date.now() + snoozeSeconds * 1000);

      setNextReminderTime(targetTime);
      setIsWaitingForReminder(true);

      timer.startTimer(snoozeSeconds, () => {
        setIsWaitingForReminder(false);
        setNextReminderTime(null);
        onTrigger();
      });
    },
    [timer]
  );

  // Override stop and reset to clear reminder state
  const stopTimer = useCallback(() => {
    timer.stopTimer();
    setIsWaitingForReminder(false);
    setNextReminderTime(null);
  }, [timer]);

  const resetTimer = useCallback(() => {
    timer.resetTimer();
    setIsWaitingForReminder(false);
    setNextReminderTime(null);
  }, [timer]);

  return {
    ...timer,
    stopTimer,
    resetTimer,
    startReminderTimer,
    startSnoozeTimer,
    nextReminderTime,
    isWaitingForReminder,
  };
}
