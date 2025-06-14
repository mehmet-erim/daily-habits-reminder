"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Calendar,
  Settings,
  TrendingUp,
  Bell,
  Target,
  Zap,
  History,
  BarChart3,
} from "lucide-react";

interface QuickActionsProps {
  userId: string;
}

export function QuickActions({ userId }: QuickActionsProps) {
  const [activeAction, setActiveAction] = useState<string | null>(null);

  const handleActionClick = (actionId: string) => {
    setActiveAction(actionId);
    // Reset after animation
    setTimeout(() => setActiveAction(null), 200);
  };

  const quickActions = [
    {
      id: "create-reminder",
      title: "New Reminder",
      description: "Create a wellness reminder",
      icon: Plus,
      href: "/reminders/new",
      color:
        "bg-blue-400/10 text-blue-400 border-blue-400/20 hover:bg-blue-400/20",
      shortcut: "Ctrl+N",
    },
    {
      id: "view-reminders",
      title: "All Reminders",
      description: "Manage your reminders",
      icon: Bell,
      href: "/reminders",
      color:
        "bg-green-400/10 text-green-400 border-green-400/20 hover:bg-green-400/20",
      shortcut: "Ctrl+R",
    },
    {
      id: "view-history",
      title: "History",
      description: "View past activity",
      icon: History,
      href: "/history",
      color:
        "bg-purple-400/10 text-purple-400 border-purple-400/20 hover:bg-purple-400/20",
      shortcut: "Ctrl+H",
    },
    {
      id: "view-analytics",
      title: "Analytics",
      description: "View your progress",
      icon: BarChart3,
      href: "/analytics",
      color:
        "bg-orange-400/10 text-orange-400 border-orange-400/20 hover:bg-orange-400/20",
      shortcut: "Ctrl+A",
    },
    {
      id: "settings",
      title: "Settings",
      description: "Customize your experience",
      icon: Settings,
      href: "/settings",
      color:
        "bg-gray-400/10 text-gray-400 border-gray-400/20 hover:bg-gray-400/20",
      shortcut: "Ctrl+,",
    },
    {
      id: "goals",
      title: "Goals",
      description: "Set and track goals",
      icon: Target,
      href: "/goals",
      color:
        "bg-pink-400/10 text-pink-400 border-pink-400/20 hover:bg-pink-400/20",
      shortcut: "Ctrl+G",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Zap className="h-5 w-5 mr-2" />
          Quick Actions
        </CardTitle>
        <CardDescription>Fast access to common actions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            const isActive = activeAction === action.id;

            return (
              <Link
                key={action.id}
                href={action.href}
                onClick={() => handleActionClick(action.id)}
              >
                <Button
                  variant="outline"
                  className={`
                    w-full h-24 sm:h-28 p-3 flex flex-col items-center justify-center text-center
                    transition-all duration-200 ease-in-out
                    ${action.color}
                    ${isActive ? "scale-95" : "hover:scale-105"}
                    group overflow-hidden
                  `}
                >
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6 mb-1 sm:mb-2 group-hover:scale-110 transition-transform duration-200 flex-shrink-0" />
                  <div className="space-y-0.5 min-h-0 flex-1 flex flex-col justify-center">
                    <div className="font-medium text-xs sm:text-sm truncate w-full">
                      {action.title}
                    </div>
                    <div className="text-xs opacity-80 truncate w-full hidden sm:block">
                      {action.description}
                    </div>
                    <div className="text-xs opacity-60 font-mono truncate w-full">
                      {action.shortcut}
                    </div>
                  </div>
                </Button>
              </Link>
            );
          })}
        </div>

        {/* Additional Quick Stats */}
        <div className="mt-6 pt-6 border-t border-border">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="space-y-1">
              <div className="flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-green-400 mr-1" />
                <span className="text-lg font-bold text-foreground">7</span>
              </div>
              <p className="text-xs text-muted-foreground">Day Streak</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-center">
                <Calendar className="h-4 w-4 text-blue-400 mr-1" />
                <span className="text-lg font-bold text-foreground">85%</span>
              </div>
              <p className="text-xs text-muted-foreground">This Week</p>
            </div>
          </div>
        </div>

        {/* Motivational Message */}
        <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-blue-400/10 to-purple-400/10 border border-blue-400/20">
          <div className="flex items-center">
            <Target className="h-4 w-4 text-blue-400 mr-2 flex-shrink-0" />
            <p className="text-sm text-foreground font-medium">
              Keep up the great work!
            </p>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            You're building healthy habits one reminder at a time.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
