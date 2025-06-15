"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Monitor, Moon, Sun, Palette, Check, Settings } from "lucide-react";
import {
  useThemeManager,
  THEME_OPTIONS,
  announceThemeChange,
  preloadTheme,
  Theme,
} from "@/lib/theme";
import { toast } from "sonner";

interface ThemeToggleProps {
  showLabel?: boolean;
  showDescription?: boolean;
  variant?: "default" | "card" | "inline";
  size?: "sm" | "md" | "lg";
}

export default function ThemeToggle({
  showLabel = true,
  showDescription = false,
  variant = "default",
  size = "md",
}: ThemeToggleProps) {
  const { theme, actualTheme, setTheme, mounted } = useThemeManager();
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Preload themes for smooth transitions
  useEffect(() => {
    if (mounted) {
      ["dark", "light"].forEach((t) => {
        if (t !== actualTheme) {
          preloadTheme(t as "dark" | "light");
        }
      });
    }
  }, [mounted, actualTheme]);

  const handleThemeChange = async (newTheme: Theme) => {
    if (newTheme === theme) return;

    setIsTransitioning(true);

    try {
      // Announce change for accessibility
      const resolvedTheme =
        newTheme === "system"
          ? window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light"
          : newTheme;

      announceThemeChange(resolvedTheme);

      // Apply theme
      setTheme(newTheme);

      // Show success message
      const themeLabel = THEME_OPTIONS.find(
        (opt) => opt.value === newTheme
      )?.label;
      toast.success(`Theme changed to ${themeLabel}`);
    } catch (error) {
      console.error("Failed to change theme:", error);
      toast.error("Failed to change theme");
    } finally {
      // Add slight delay for smooth transition
      setTimeout(() => {
        setIsTransitioning(false);
      }, 200);
    }
  };

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="animate-pulse">
        <div className="h-10 bg-muted rounded"></div>
      </div>
    );
  }

  const getThemeIcon = (themeValue: Theme) => {
    switch (themeValue) {
      case "light":
        return <Sun className="h-4 w-4" />;
      case "dark":
        return <Moon className="h-4 w-4" />;
      case "system":
        return <Monitor className="h-4 w-4" />;
    }
  };

  const getCurrentThemeInfo = () => {
    return THEME_OPTIONS.find((opt) => opt.value === theme);
  };

  if (variant === "card") {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Theme Preference
          </CardTitle>
          {showDescription && (
            <CardDescription>
              Choose your preferred theme or follow your system setting
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Theme Display */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              {getThemeIcon(theme)}
              <div>
                <p className="font-medium">{getCurrentThemeInfo()?.label}</p>
                <p className="text-sm text-muted-foreground">
                  {getCurrentThemeInfo()?.description}
                </p>
              </div>
            </div>
            <Badge variant="outline" className="flex items-center gap-1">
              {actualTheme === "dark" ? (
                <Moon className="h-3 w-3" />
              ) : (
                <Sun className="h-3 w-3" />
              )}
              {actualTheme}
            </Badge>
          </div>

          {/* Theme Options */}
          <div className="grid gap-2">
            {THEME_OPTIONS.map((option) => (
              <Button
                key={option.value}
                variant={theme === option.value ? "default" : "outline"}
                onClick={() => handleThemeChange(option.value)}
                disabled={isTransitioning}
                className="justify-start h-auto p-3"
              >
                <div className="flex items-center gap-3 w-full">
                  <span className="text-lg">{option.icon}</span>
                  <div className="flex-1 text-left">
                    <p className="font-medium">{option.label}</p>
                    <p className="text-xs opacity-70">{option.description}</p>
                  </div>
                  {theme === option.value && <Check className="h-4 w-4" />}
                </div>
              </Button>
            ))}
          </div>

          {/* System Theme Info */}
          {theme === "system" && (
            <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
              <p className="flex items-center gap-2">
                <Settings className="h-3 w-3" />
                Following system preference: currently {actualTheme} mode
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (variant === "inline") {
    return (
      <div className="flex items-center gap-3">
        {showLabel && <Label className="text-sm font-medium">Theme:</Label>}
        <div className="flex items-center gap-2">
          {THEME_OPTIONS.map((option) => (
            <Button
              key={option.value}
              variant={theme === option.value ? "default" : "outline"}
              size="sm"
              onClick={() => handleThemeChange(option.value)}
              disabled={isTransitioning}
              className="flex items-center gap-2"
            >
              <span>{option.icon}</span>
              {size !== "sm" && option.label}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  // Default variant - dropdown select
  return (
    <div className="space-y-2">
      {showLabel && (
        <Label className="text-sm font-medium flex items-center gap-2">
          <Palette className="h-4 w-4" />
          Theme
        </Label>
      )}

      <Select
        value={theme}
        onValueChange={handleThemeChange}
        disabled={isTransitioning}
      >
        <SelectTrigger
          className={`
          ${size === "sm" ? "h-8" : size === "lg" ? "h-12" : "h-10"}
          ${isTransitioning ? "opacity-50" : ""}
        `}
        >
          <div className="flex items-center gap-2">
            {getThemeIcon(theme)}
            <SelectValue>{getCurrentThemeInfo()?.label}</SelectValue>
          </div>
        </SelectTrigger>

        <SelectContent>
          {THEME_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex items-center gap-3">
                <span>{option.icon}</span>
                <div>
                  <p className="font-medium">{option.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {option.description}
                  </p>
                </div>
                {theme === option.value && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {showDescription && (
        <p className="text-xs text-muted-foreground">
          {getCurrentThemeInfo()?.description}
          {theme === "system" && (
            <span className="block mt-1">
              Currently using {actualTheme} mode
            </span>
          )}
        </p>
      )}
    </div>
  );
}

// Quick theme toggle button for navigation
export function QuickThemeToggle() {
  const { theme, setTheme, mounted } = useThemeManager();

  if (!mounted) return null;

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="h-8 w-8 p-0"
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </Button>
  );
}

// Theme status indicator
export function ThemeStatusIndicator() {
  const { theme, actualTheme, mounted } = useThemeManager();

  if (!mounted) return null;

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      {getThemeIcon(theme)}
      <span>
        {THEME_OPTIONS.find((opt) => opt.value === theme)?.label}
        {theme === "system" && ` (${actualTheme})`}
      </span>
    </div>
  );
}

// Helper function for consistent icon rendering
const getThemeIcon = (themeValue: Theme) => {
  switch (themeValue) {
    case "light":
      return <Sun className="h-4 w-4" />;
    case "dark":
      return <Moon className="h-4 w-4" />;
    case "system":
      return <Monitor className="h-4 w-4" />;
  }
};
