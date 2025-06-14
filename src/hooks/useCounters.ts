"use client";

import { useState, useEffect, useCallback } from "react";
import { CounterData } from "@/components/CounterDisplay";

export interface UseCountersReturn {
  counters: CounterData[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createCounter: (data: CreateCounterData) => Promise<boolean>;
  updateCounter: (
    counterId: string,
    action: CounterAction,
    data?: any
  ) => Promise<boolean>;
  deleteCounter: (counterId: string) => Promise<boolean>;
}

export interface CreateCounterData {
  name: string;
  unit: string;
  iconName?: string;
  color?: string;
  dailyGoal?: number;
  reminderId?: string;
}

export type CounterAction = "increment" | "decrement" | "set" | "reset";

export const useCounters = (): UseCountersReturn => {
  const [counters, setCounters] = useState<CounterData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch counters
  const fetchCounters = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/counters");

      if (response.ok) {
        const data = await response.json();
        setCounters(data.counters || []);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch counters");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch counters";
      setError(errorMessage);
      console.error("Error fetching counters:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create counter
  const createCounter = useCallback(
    async (data: CreateCounterData): Promise<boolean> => {
      try {
        const response = await fetch("/api/counters", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        if (response.ok) {
          const result = await response.json();
          setCounters((prev) => [...prev, result.counter]);
          return true;
        } else {
          const errorData = await response.json();
          setError(errorData.error || "Failed to create counter");
          return false;
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create counter";
        setError(errorMessage);
        console.error("Error creating counter:", err);
        return false;
      }
    },
    []
  );

  // Update counter (increment, decrement, set, reset)
  const updateCounter = useCallback(
    async (
      counterId: string,
      action: CounterAction,
      data?: any
    ): Promise<boolean> => {
      try {
        const body = data || {};

        // Handle decrement as negative increment
        if (action === "decrement") {
          action = "increment";
          body.amount = -(body.amount || 1);
        }

        const response = await fetch(
          `/api/counters/${counterId}?action=${action}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
          }
        );

        if (response.ok) {
          const result = await response.json();
          setCounters((prev) =>
            prev.map((counter) =>
              counter.id === counterId
                ? { ...counter, currentValue: result.counter.currentValue }
                : counter
            )
          );
          return true;
        } else {
          const errorData = await response.json();
          setError(errorData.error || `Failed to ${action} counter`);
          return false;
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : `Failed to ${action} counter`;
        setError(errorMessage);
        console.error(`Error ${action} counter:`, err);
        return false;
      }
    },
    []
  );

  // Delete counter
  const deleteCounter = useCallback(
    async (counterId: string): Promise<boolean> => {
      try {
        const response = await fetch(`/api/counters/${counterId}`, {
          method: "DELETE",
        });

        if (response.ok) {
          setCounters((prev) =>
            prev.filter((counter) => counter.id !== counterId)
          );
          return true;
        } else {
          const errorData = await response.json();
          setError(errorData.error || "Failed to delete counter");
          return false;
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to delete counter";
        setError(errorMessage);
        console.error("Error deleting counter:", err);
        return false;
      }
    },
    []
  );

  // Initialize counters on mount
  useEffect(() => {
    fetchCounters();
  }, [fetchCounters]);

  return {
    counters,
    loading,
    error,
    refetch: fetchCounters,
    createCounter,
    updateCounter,
    deleteCounter,
  };
};

// Helper functions for specific counter actions
export const useCounterActions = (
  counterId: string,
  onUpdate?: (newValue: number) => void
) => {
  const { updateCounter } = useCounters();

  const increment = useCallback(
    async (amount: number = 1) => {
      const success = await updateCounter(counterId, "increment", { amount });
      return success;
    },
    [counterId, updateCounter]
  );

  const decrement = useCallback(
    async (amount: number = 1) => {
      const success = await updateCounter(counterId, "decrement", { amount });
      return success;
    },
    [counterId, updateCounter]
  );

  const setValue = useCallback(
    async (value: number) => {
      const success = await updateCounter(counterId, "set", { value });
      return success;
    },
    [counterId, updateCounter]
  );

  const reset = useCallback(async () => {
    const success = await updateCounter(counterId, "reset");
    return success;
  }, [counterId, updateCounter]);

  return {
    increment,
    decrement,
    setValue,
    reset,
  };
};
