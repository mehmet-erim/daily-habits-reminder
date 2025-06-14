"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CounterDisplay, type CounterData } from "./CounterDisplay";
import { CounterButtons } from "./CounterButtons";
import { Plus, Activity, Target, TrendingUp, AlertCircle } from "lucide-react";
import { COUNTER_UNITS } from "@/lib/validations";

interface CountersSectionProps {
  userId: string;
}

export const CountersSection: React.FC<CountersSectionProps> = ({ userId }) => {
  const [counters, setCounters] = useState<CounterData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    unit: "count" as const,
    iconName: "",
    color: "#3b82f6",
    dailyGoal: "",
  });

  // Fetch today's counters
  const fetchCounters = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/counters");

      if (response.ok) {
        const data = await response.json();
        setCounters(data.counters || []);
        setError(null);
      } else {
        throw new Error("Failed to fetch counters");
      }
    } catch (err) {
      setError("Failed to load counters");
      console.error("Error fetching counters:", err);
    } finally {
      setLoading(false);
    }
  };

  // Create new counter
  const handleCreateCounter = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload = {
        name: formData.name,
        unit: formData.unit,
        iconName: formData.iconName || undefined,
        color: formData.color,
        dailyGoal: formData.dailyGoal
          ? parseInt(formData.dailyGoal)
          : undefined,
      };

      const response = await fetch("/api/counters", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        setCounters((prev) => [...prev, data.counter]);
        setShowAddDialog(false);
        setFormData({
          name: "",
          unit: "count",
          iconName: "",
          color: "#3b82f6",
          dailyGoal: "",
        });
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to create counter");
      }
    } catch (err) {
      setError("Failed to create counter");
      console.error("Error creating counter:", err);
    }
  };

  // Handle counter value update
  const handleCounterUpdate = (counterId: string, newValue: number) => {
    setCounters((prev) =>
      prev.map((counter) =>
        counter.id === counterId
          ? { ...counter, currentValue: newValue }
          : counter
      )
    );
  };

  // Calculate stats
  const stats = React.useMemo(() => {
    const total = counters.length;
    const withGoals = counters.filter((c) => c.dailyGoal).length;
    const goalsReached = counters.filter(
      (c) => c.dailyGoal && c.currentValue >= c.dailyGoal
    ).length;
    const totalValue = counters.reduce((sum, c) => sum + c.currentValue, 0);

    return {
      total,
      withGoals,
      goalsReached,
      totalValue,
      goalCompletionRate:
        withGoals > 0 ? Math.round((goalsReached / withGoals) * 100) : 0,
    };
  }, [counters]);

  useEffect(() => {
    fetchCounters();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Today's Counters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-pulse text-muted-foreground">
              Loading counters...
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Today's Counters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32 text-destructive">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Today's Counters
            </CardTitle>
            <CardDescription>
              Track your daily activities and progress
            </CardDescription>
          </div>

          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="shrink-0">
                <Plus className="w-4 h-4 mr-1" />
                Add Counter
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Counter</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateCounter} className="space-y-4">
                <div>
                  <Label htmlFor="name">Counter Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="e.g., Water, Coffee, Steps"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="unit">Unit</Label>
                  <Select
                    value={formData.unit}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, unit: value as any }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTER_UNITS.map((unit) => (
                        <SelectItem key={unit} value={unit}>
                          {unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="dailyGoal">Daily Goal (optional)</Label>
                  <Input
                    id="dailyGoal"
                    type="number"
                    value={formData.dailyGoal}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        dailyGoal: e.target.value,
                      }))
                    }
                    placeholder="e.g., 8 for 8 glasses of water"
                    min="1"
                  />
                </div>

                <div>
                  <Label htmlFor="color">Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="color"
                      type="color"
                      value={formData.color}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          color: e.target.value,
                        }))
                      }
                      className="w-12 h-9 p-1 cursor-pointer"
                    />
                    <Input
                      value={formData.color}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          color: e.target.value,
                        }))
                      }
                      placeholder="#3b82f6"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="iconName">Icon Name (optional)</Label>
                  <Input
                    id="iconName"
                    value={formData.iconName}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        iconName: e.target.value,
                      }))
                    }
                    placeholder="e.g., droplets, coffee, footprints"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Use Lucide icon names like: droplets, coffee, footprints,
                    clock, heart
                  </p>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddDialog(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">
                    Create Counter
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        {/* Stats Summary */}
        {counters.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-6 p-4 rounded-lg bg-muted/30">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">
                {stats.total}
              </div>
              <div className="text-xs text-muted-foreground">
                Active Counters
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {stats.goalsReached}
              </div>
              <div className="text-xs text-muted-foreground">Goals Reached</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {stats.goalCompletionRate}%
              </div>
              <div className="text-xs text-muted-foreground">
                Completion Rate
              </div>
            </div>
          </div>
        )}

        {/* Counters Grid */}
        {counters.length === 0 ? (
          <div className="text-center py-8">
            <Target className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No counters yet
            </h3>
            <p className="text-muted-foreground mb-4">
              Create your first counter to start tracking daily activities
            </p>
            <Button onClick={() => setShowAddDialog(true)} size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Add Your First Counter
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {counters.map((counter) => (
              <div
                key={counter.id}
                className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card/50"
              >
                <div className="flex-1">
                  <CounterDisplay
                    counter={counter}
                    compact
                    className="border-0 bg-transparent p-0"
                  />
                </div>
                <div className="shrink-0">
                  <CounterButtons
                    counterId={counter.id}
                    currentValue={counter.currentValue}
                    unit={counter.unit}
                    color={counter.color}
                    onUpdate={(newValue) =>
                      handleCounterUpdate(counter.id, newValue)
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CountersSection;
