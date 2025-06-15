"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Home,
  Bell,
  BarChart3,
  Settings,
  History,
  Menu,
  Plus,
} from "lucide-react";
import Link from "next/link";

interface MobileNavProps {
  currentPath?: string;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  hapticType?: "selection" | "buttonPress";
}

const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: Home,
    hapticType: "selection",
  },
  {
    href: "/reminders",
    label: "Reminders",
    icon: Bell,
    hapticType: "selection",
  },
  {
    href: "/analytics",
    label: "Analytics",
    icon: BarChart3,
    hapticType: "selection",
  },
  {
    href: "/history",
    label: "History",
    icon: History,
    hapticType: "selection",
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
    hapticType: "selection",
  },
];

export function MobileNav({ currentPath = "/" }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const haptic = useHapticFeedback();
  const isMobile = useIsMobile();

  const handleNavClick = (item: NavItem) => {
    if (item.hapticType === "selection") {
      haptic.feedback.selection();
    } else {
      haptic.feedback.buttonPress();
    }
    setIsOpen(false);
  };

  const handleMenuToggle = () => {
    haptic.feedback.buttonPress();
    setIsOpen(!isOpen);
  };

  if (!isMobile) {
    return null; // Don't show mobile nav on desktop
  }

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border lg:hidden">
        <div className="flex items-center justify-around py-2 px-4 safe-area-pb">
          {navItems.slice(0, 4).map((item) => {
            const isActive = currentPath === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => handleNavClick(item)}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-lg min-w-[44px] min-h-[44px] transition-all duration-200",
                  "touch-manipulation active:scale-95",
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}

          {/* Menu Button */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMenuToggle}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 min-w-[44px] min-h-[44px]",
                  "touch-manipulation active:scale-95"
                )}
              >
                <Menu className="h-5 w-5" />
                <span className="text-xs font-medium">More</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[400px]">
              <div className="py-6">
                <h2 className="text-lg font-semibold mb-4">Navigation</h2>
                <nav className="space-y-2">
                  {navItems.map((item) => {
                    const isActive = currentPath === item.href;
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => handleNavClick(item)}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg min-h-[44px] transition-all duration-200",
                          "touch-manipulation active:scale-[0.98]",
                          isActive
                            ? "text-primary bg-primary/10 font-medium"
                            : "text-foreground hover:bg-muted/50"
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}

                  <div className="pt-4 mt-4 border-t border-border">
                    <Link
                      href="/reminders/new"
                      onClick={() =>
                        handleNavClick({
                          href: "/reminders/new",
                          label: "New Reminder",
                          icon: Plus,
                          hapticType: "buttonPress",
                        })
                      }
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg min-h-[44px] transition-all duration-200",
                        "touch-manipulation active:scale-[0.98]",
                        "bg-primary text-primary-foreground hover:bg-primary/90"
                      )}
                    >
                      <Plus className="h-5 w-5" />
                      <span>Create Reminder</span>
                    </Link>
                  </div>
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Spacer to prevent content from being hidden behind fixed nav */}
      <div className="h-16 lg:hidden" />
    </>
  );
}

// Top mobile header component
export function MobileHeader({
  title,
  showBack = false,
  backHref = "/dashboard",
  children,
}: {
  title: string;
  showBack?: boolean;
  backHref?: string;
  children?: React.ReactNode;
}) {
  const haptic = useHapticFeedback();
  const isMobile = useIsMobile();

  const handleBackClick = () => {
    haptic.feedback.buttonPress();
  };

  if (!isMobile) {
    return null;
  }

  return (
    <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border lg:hidden">
      <div className="flex items-center justify-between p-4 safe-area-pt">
        <div className="flex items-center gap-3">
          {showBack && (
            <Link
              href={backHref}
              onClick={handleBackClick}
              className={cn(
                "p-2 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center",
                "touch-manipulation active:scale-95 hover:bg-muted/50"
              )}
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </Link>
          )}
          <h1 className="text-lg font-semibold text-foreground truncate">
            {title}
          </h1>
        </div>
        {children && <div className="flex items-center gap-2">{children}</div>}
      </div>
    </div>
  );
}
