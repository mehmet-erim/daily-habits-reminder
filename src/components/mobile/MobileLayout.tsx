"use client";

import React, { useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  handleIOSSafariViewport,
  isMobileDevice,
  getSafeAreaInsets,
} from "@/lib/mobile-utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface MobileLayoutProps {
  children: React.ReactNode;
  className?: string;
  enableSafeArea?: boolean;
  enableViewportFix?: boolean;
  fullHeight?: boolean;
}

export function MobileLayout({
  children,
  className,
  enableSafeArea = true,
  enableViewportFix = true,
  fullHeight = false,
}: MobileLayoutProps) {
  const isMobile = useIsMobile();

  useEffect(() => {
    if (enableViewportFix && isMobileDevice()) {
      handleIOSSafariViewport();
    }
  }, [enableViewportFix]);

  // Get safe area insets
  const safeAreaInsets =
    enableSafeArea && isMobile ? getSafeAreaInsets() : null;

  // Create CSS custom properties for safe area
  const safeAreaStyles = safeAreaInsets
    ? ({
        "--safe-area-inset-top": `${safeAreaInsets.top}px`,
        "--safe-area-inset-right": `${safeAreaInsets.right}px`,
        "--safe-area-inset-bottom": `${safeAreaInsets.bottom}px`,
        "--safe-area-inset-left": `${safeAreaInsets.left}px`,
      } as React.CSSProperties)
    : {};

  return (
    <div
      className={cn(
        "w-full",
        fullHeight && (isMobile ? "min-h-[100dvh]" : "min-h-screen"),
        enableSafeArea &&
          isMobile && [
            "pt-[env(safe-area-inset-top,0px)]",
            "pr-[env(safe-area-inset-right,0px)]",
            "pb-[env(safe-area-inset-bottom,0px)]",
            "pl-[env(safe-area-inset-left,0px)]",
          ],
        // Mobile-specific optimizations
        isMobile && [
          "touch-pan-y", // Allow vertical panning
          "overscroll-behavior-y-none", // Prevent overscroll
          "-webkit-overflow-scrolling-touch", // Smooth scrolling on iOS
        ],
        className
      )}
      style={safeAreaStyles}
    >
      {children}
    </div>
  );
}

// Hook for mobile layout utilities
export function useMobileLayout() {
  const isMobile = useIsMobile();

  return {
    isMobile,
    safeAreaInsets: isMobile ? getSafeAreaInsets() : null,
    isMobileDevice: isMobileDevice(),
  };
}

// Mobile-specific spacing component
export function MobileSpacing({
  size = "md",
  children,
  className,
}: {
  size?: "sm" | "md" | "lg" | "xl";
  children: React.ReactNode;
  className?: string;
}) {
  const isMobile = useIsMobile();

  const spacing = {
    sm: isMobile ? "space-y-3" : "space-y-4",
    md: isMobile ? "space-y-4" : "space-y-6",
    lg: isMobile ? "space-y-6" : "space-y-8",
    xl: isMobile ? "space-y-8" : "space-y-12",
  };

  return <div className={cn(spacing[size], className)}>{children}</div>;
}

// Mobile-optimized container
export function MobileContainer({
  children,
  className,
  maxWidth = "7xl",
  padding = "responsive",
}: {
  children: React.ReactNode;
  className?: string;
  maxWidth?:
    | "xs"
    | "sm"
    | "md"
    | "lg"
    | "xl"
    | "2xl"
    | "3xl"
    | "4xl"
    | "5xl"
    | "6xl"
    | "7xl"
    | "full";
  padding?: "none" | "sm" | "md" | "lg" | "responsive";
}) {
  const isMobile = useIsMobile();

  const maxWidthClasses = {
    xs: "max-w-xs",
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
    "5xl": "max-w-5xl",
    "6xl": "max-w-6xl",
    "7xl": "max-w-7xl",
    full: "max-w-full",
  };

  const paddingClasses = {
    none: "",
    sm: "p-2",
    md: "p-4",
    lg: "p-6",
    responsive: isMobile ? "p-4" : "p-6",
  };

  return (
    <div className={cn(maxWidthClasses[maxWidth], "mx-auto", className)}>
      <div className={cn(paddingClasses[padding])}>{children}</div>
    </div>
  );
}

// Mobile-specific card component with touch optimizations
export function MobileCard({
  children,
  className,
  interactive = false,
  ...props
}: React.ComponentProps<"div"> & {
  interactive?: boolean;
}) {
  const isMobile = useIsMobile();

  return (
    <div
      className={cn(
        "bg-card border border-border rounded-lg shadow-sm",
        // Mobile touch optimizations
        isMobile && [
          interactive && "touch-manipulation cursor-pointer",
          interactive &&
            "active:scale-[0.98] transition-transform duration-150",
          interactive && "hover:shadow-md",
        ],
        // Ensure minimum touch target size
        interactive && isMobile && "min-h-[44px]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
