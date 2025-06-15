"use client";

// Mobile device detection and optimization utilities

/**
 * Check if the current device is mobile
 */
export function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;

  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * Check if the current device is a tablet
 */
export function isTabletDevice(): boolean {
  if (typeof window === "undefined") return false;

  return /iPad|Android(?=.*Mobile)/i.test(navigator.userAgent);
}

/**
 * Check if the current device is iOS
 */
export function isIOSDevice(): boolean {
  if (typeof window === "undefined") return false;

  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

/**
 * Check if the current device is Android
 */
export function isAndroidDevice(): boolean {
  if (typeof window === "undefined") return false;

  return /Android/i.test(navigator.userAgent);
}

/**
 * Get the current viewport dimensions
 */
export function getViewportDimensions() {
  if (typeof window === "undefined") {
    return { width: 0, height: 0 };
  }

  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

/**
 * Check if the viewport is in portrait mode
 */
export function isPortraitMode(): boolean {
  const { width, height } = getViewportDimensions();
  return height > width;
}

/**
 * Check if the viewport is in landscape mode
 */
export function isLandscapeMode(): boolean {
  return !isPortraitMode();
}

/**
 * Get safe area insets for devices with notches/home indicators
 */
export function getSafeAreaInsets() {
  if (typeof window === "undefined") {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }

  const computedStyle = getComputedStyle(document.documentElement);

  return {
    top: parseInt(
      computedStyle.getPropertyValue("env(safe-area-inset-top)") || "0",
      10
    ),
    right: parseInt(
      computedStyle.getPropertyValue("env(safe-area-inset-right)") || "0",
      10
    ),
    bottom: parseInt(
      computedStyle.getPropertyValue("env(safe-area-inset-bottom)") || "0",
      10
    ),
    left: parseInt(
      computedStyle.getPropertyValue("env(safe-area-inset-left)") || "0",
      10
    ),
  };
}

/**
 * Optimize touch target size (minimum 44px as per accessibility guidelines)
 */
export function getTouchTargetSize(baseSize: number): number {
  const MINIMUM_TOUCH_TARGET = 44; // px
  return Math.max(baseSize, MINIMUM_TOUCH_TARGET);
}

/**
 * Get optimized font size for mobile devices
 */
export function getMobileFontSize(baseFontSize: number): number {
  if (!isMobileDevice()) return baseFontSize;

  const { width } = getViewportDimensions();

  // Scale font size based on viewport width
  if (width < 375) {
    return Math.max(baseFontSize * 0.9, 14); // Minimum 14px
  } else if (width > 414) {
    return baseFontSize * 1.1;
  }

  return baseFontSize;
}

/**
 * Check if the device supports touch
 */
export function isTouchDevice(): boolean {
  if (typeof window === "undefined") return false;

  return "ontouchstart" in window || navigator.maxTouchPoints > 0;
}

/**
 * Check if the device supports haptic feedback
 */
export function supportsHapticFeedback(): boolean {
  if (typeof navigator === "undefined") return false;

  return "vibrate" in navigator;
}

/**
 * Prevent zoom on double tap (iOS Safari specific)
 */
export function preventDoubleTabZoom(element: HTMLElement) {
  if (!isIOSDevice()) return;

  let lastTouchEnd = 0;

  element.addEventListener(
    "touchend",
    (event) => {
      const now = new Date().getTime();
      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    },
    false
  );
}

/**
 * Add touch ripple effect to element
 */
export function addTouchRipple(
  element: HTMLElement,
  color: string = "rgba(255, 255, 255, 0.3)"
) {
  element.addEventListener("touchstart", (event) => {
    const rect = element.getBoundingClientRect();
    const touch = event.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    const ripple = document.createElement("div");
    ripple.style.position = "absolute";
    ripple.style.borderRadius = "50%";
    ripple.style.background = color;
    ripple.style.transform = "scale(0)";
    ripple.style.animation = "ripple 0.6s linear";
    ripple.style.left = x - 10 + "px";
    ripple.style.top = y - 10 + "px";
    ripple.style.width = "20px";
    ripple.style.height = "20px";
    ripple.style.pointerEvents = "none";

    element.style.position = "relative";
    element.style.overflow = "hidden";
    element.appendChild(ripple);

    setTimeout(() => {
      ripple.remove();
    }, 600);
  });

  // Add CSS animation if not already present
  if (!document.querySelector("#ripple-animation")) {
    const style = document.createElement("style");
    style.id = "ripple-animation";
    style.textContent = `
      @keyframes ripple {
        to {
          transform: scale(4);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }
}

/**
 * Get the optimal scroll behavior for mobile
 */
export function getScrollBehavior(): ScrollBehavior {
  return isMobileDevice() ? "smooth" : "auto";
}

/**
 * Debounce function for scroll/resize events
 */
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function for performance-critical events
 */
export function throttle<T extends (...args: any[]) => void>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Mobile-specific event handlers
 */
export class MobileEventHandlers {
  private element: HTMLElement;
  private options: {
    preventDefaultTouch?: boolean;
    enableRipple?: boolean;
    rippleColor?: string;
  };

  constructor(
    element: HTMLElement,
    options: MobileEventHandlers["options"] = {}
  ) {
    this.element = element;
    this.options = {
      preventDefaultTouch: false,
      enableRipple: true,
      rippleColor: "rgba(255, 255, 255, 0.3)",
      ...options,
    };

    this.init();
  }

  private init() {
    if (this.options.enableRipple) {
      addTouchRipple(this.element, this.options.rippleColor);
    }

    preventDoubleTabZoom(this.element);

    if (this.options.preventDefaultTouch) {
      this.element.addEventListener("touchstart", (e) => e.preventDefault(), {
        passive: false,
      });
      this.element.addEventListener("touchmove", (e) => e.preventDefault(), {
        passive: false,
      });
    }
  }

  destroy() {
    // Remove event listeners if needed
    // This would require keeping track of the listeners
  }
}

/**
 * Mobile-optimized intersection observer options
 */
export function getMobileIntersectionObserverOptions(): IntersectionObserverInit {
  return {
    // Use smaller margins on mobile for better performance
    rootMargin: isMobileDevice() ? "10px" : "50px",
    threshold: isMobileDevice() ? [0, 0.25, 0.5, 0.75, 1] : [0, 0.1, 0.9, 1],
  };
}

/**
 * Check if the keyboard is likely open (mobile)
 */
export function isKeyboardOpen(): boolean {
  if (!isMobileDevice()) return false;

  const { height } = getViewportDimensions();
  const screenHeight = window.screen.height;

  // If viewport height is significantly smaller than screen height, keyboard is likely open
  return height < screenHeight * 0.75;
}

/**
 * Handle iOS Safari address bar height changes
 */
export function handleIOSSafariViewport() {
  if (!isIOSDevice()) return;

  const setViewportHeight = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty("--vh", `${vh}px`);
  };

  setViewportHeight();
  window.addEventListener("resize", throttle(setViewportHeight, 100));
}

/**
 * Mobile breakpoints (matching Tailwind CSS)
 */
export const MOBILE_BREAKPOINTS = {
  xs: 475,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

/**
 * Check if current viewport matches a breakpoint
 */
export function matchesBreakpoint(
  breakpoint: keyof typeof MOBILE_BREAKPOINTS
): boolean {
  const { width } = getViewportDimensions();
  return width >= MOBILE_BREAKPOINTS[breakpoint];
}

/**
 * Get current breakpoint name
 */
export function getCurrentBreakpoint(): keyof typeof MOBILE_BREAKPOINTS | "xs" {
  const { width } = getViewportDimensions();

  if (width >= MOBILE_BREAKPOINTS["2xl"]) return "2xl";
  if (width >= MOBILE_BREAKPOINTS.xl) return "xl";
  if (width >= MOBILE_BREAKPOINTS.lg) return "lg";
  if (width >= MOBILE_BREAKPOINTS.md) return "md";
  if (width >= MOBILE_BREAKPOINTS.sm) return "sm";

  return "xs";
}
