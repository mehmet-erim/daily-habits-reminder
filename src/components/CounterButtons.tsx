"use client";

import React, { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Plus, Minus, RotateCcw, Edit3, Check, X, Loader2 } from "lucide-react";

interface CounterButtonsProps {
  counterId: string;
  currentValue: number;
  unit: string;
  color?: string;
  disabled?: boolean;
  onUpdate?: (newValue: number) => void;
  className?: string;
}

export const CounterButtons: React.FC<CounterButtonsProps> = ({
  counterId,
  currentValue,
  unit,
  color = "#3b82f6",
  disabled = false,
  onUpdate,
  className,
}) => {
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(currentValue.toString());
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Handle counter increment
  const handleIncrement = async (amount: number = 1) => {
    if (disabled || isPending) return;

    startTransition(async () => {
      try {
        const response = await fetch(
          `/api/counters/${counterId}?action=increment`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ amount }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          onUpdate?.(data.counter.currentValue);
        } else {
          console.error("Failed to increment counter");
        }
      } catch (error) {
        console.error("Error incrementing counter:", error);
      }
    });
  };

  // Handle counter decrement
  const handleDecrement = async (amount: number = 1) => {
    if (disabled || isPending || currentValue <= 0) return;

    startTransition(async () => {
      try {
        const response = await fetch(
          `/api/counters/${counterId}?action=increment`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ amount: -amount }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          onUpdate?.(data.counter.currentValue);
        } else {
          console.error("Failed to decrement counter");
        }
      } catch (error) {
        console.error("Error decrementing counter:", error);
      }
    });
  };

  // Handle setting specific value
  const handleSetValue = async (value: number) => {
    if (disabled || isPending) return;

    startTransition(async () => {
      try {
        const response = await fetch(`/api/counters/${counterId}?action=set`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ value }),
        });

        if (response.ok) {
          const data = await response.json();
          onUpdate?.(data.counter.currentValue);
          setIsEditing(false);
        } else {
          console.error("Failed to set counter value");
        }
      } catch (error) {
        console.error("Error setting counter value:", error);
      }
    });
  };

  // Handle counter reset
  const handleReset = async () => {
    if (disabled || isPending) return;

    startTransition(async () => {
      try {
        const response = await fetch(
          `/api/counters/${counterId}?action=reset`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          onUpdate?.(data.counter.currentValue);
          setShowResetConfirm(false);
        } else {
          console.error("Failed to reset counter");
        }
      } catch (error) {
        console.error("Error resetting counter:", error);
      }
    });
  };

  // Handle edit value submit
  const handleEditSubmit = () => {
    const value = parseInt(editValue);
    if (!isNaN(value) && value >= 0) {
      handleSetValue(value);
    } else {
      setEditValue(currentValue.toString());
      setIsEditing(false);
    }
  };

  // Handle edit cancel
  const handleEditCancel = () => {
    setEditValue(currentValue.toString());
    setIsEditing(false);
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Decrement Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleDecrement()}
        disabled={disabled || isPending || currentValue <= 0}
        className="h-8 w-8 p-0 hover:bg-accent"
      >
        {isPending ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <Minus className="w-3 h-3" />
        )}
      </Button>

      {/* Current Value Display / Edit */}
      <div className="flex items-center min-w-[80px] justify-center">
        {isEditing ? (
          <div className="flex items-center gap-1">
            <Input
              type="number"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="h-6 w-12 px-1 text-center text-xs"
              min="0"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleEditSubmit();
                if (e.key === "Escape") handleEditCancel();
              }}
              autoFocus
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEditSubmit}
              className="h-6 w-6 p-0"
            >
              <Check className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEditCancel}
              className="h-6 w-6 p-0"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        ) : (
          <Badge
            variant="secondary"
            className="cursor-pointer hover:bg-accent text-sm px-2 py-1"
            onClick={() => {
              setIsEditing(true);
              setEditValue(currentValue.toString());
            }}
            style={{ backgroundColor: `${color}20`, color: color }}
          >
            {currentValue} {unit !== "count" ? unit : ""}
            <Edit3 className="w-3 h-3 ml-1 opacity-50" />
          </Badge>
        )}
      </div>

      {/* Increment Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleIncrement()}
        disabled={disabled || isPending}
        className="h-8 w-8 p-0 hover:bg-accent"
      >
        {isPending ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <Plus className="w-3 h-3" />
        )}
      </Button>

      {/* Quick Increment Buttons */}
      <div className="flex gap-1 ml-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleIncrement(5)}
          disabled={disabled || isPending}
          className="h-6 px-2 text-xs hover:bg-accent"
        >
          +5
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleIncrement(10)}
          disabled={disabled || isPending}
          className="h-6 px-2 text-xs hover:bg-accent"
        >
          +10
        </Button>
      </div>

      {/* Reset Button with Confirmation */}
      <Dialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            disabled={disabled || isPending || currentValue === 0}
            className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive ml-2"
          >
            <RotateCcw className="w-3 h-3" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Counter</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to reset this counter to 0? This action
              cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowResetConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleReset}
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                    Resetting...
                  </>
                ) : (
                  "Reset"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CounterButtons;
