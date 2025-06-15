"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, X, Smartphone, Monitor, Wifi } from "lucide-react";
import { toast } from "sonner";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface InstallPromptProps {
  onInstall?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export const InstallPrompt = ({
  onInstall,
  onDismiss,
  className = "",
}: InstallPromptProps) => {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const checkIfInstalled = () => {
      if ("getInstalledRelatedApps" in navigator) {
        // Modern approach
        (navigator as any)
          .getInstalledRelatedApps()
          .then((apps: any[]) => {
            setIsInstalled(apps.length > 0);
          })
          .catch(() => {
            // Fallback to display mode check
            setIsInstalled(
              window.matchMedia("(display-mode: standalone)").matches
            );
          });
      } else {
        // Fallback to display mode check
        setIsInstalled(window.matchMedia("(display-mode: standalone)").matches);
      }
    };

    checkIfInstalled();

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const installEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(installEvent);
      setIsInstallable(true);

      // Show prompt after a delay if not dismissed before
      setTimeout(() => {
        if (!isInstalled && !localStorage.getItem("pwa-install-dismissed")) {
          setShowPrompt(true);
        }
      }, 5000);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setShowPrompt(false);
      setDeferredPrompt(null);

      toast.success("App installed successfully!", {
        description:
          "You can now access Wellness Tracker from your home screen",
      });

      onInstall?.();
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [isInstalled, onInstall]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      toast.error("Installation not available", {
        description: "Your browser doesn't support app installation",
      });
      return;
    }

    setIsInstalling(true);

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;

      if (choiceResult.outcome === "accepted") {
        console.log("User accepted the install prompt");
        setShowPrompt(false);
      } else {
        console.log("User dismissed the install prompt");
        toast.info("Installation cancelled");
      }
    } catch (error) {
      console.error("Error during installation:", error);
      toast.error("Installation failed", {
        description:
          "Please try again or install manually from your browser menu",
      });
    } finally {
      setIsInstalling(false);
      setDeferredPrompt(null);
      setIsInstallable(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("pwa-install-dismissed", "true");
    onDismiss?.();

    toast.info("Install prompt dismissed", {
      description: "You can install the app later from your browser menu",
    });
  };

  const handleRemindLater = () => {
    setShowPrompt(false);
    // Set reminder for 24 hours
    localStorage.setItem(
      "pwa-install-remind-later",
      String(Date.now() + 24 * 60 * 60 * 1000)
    );
  };

  // Don't show if already installed or not installable
  if (isInstalled || !isInstallable) {
    return null;
  }

  // Check if user chose "remind later" and time hasn't passed
  const remindLaterTime = localStorage.getItem("pwa-install-remind-later");
  if (remindLaterTime && Date.now() < parseInt(remindLaterTime)) {
    return null;
  }

  // Don't show if user permanently dismissed
  if (localStorage.getItem("pwa-install-dismissed")) {
    return null;
  }

  if (!showPrompt) {
    return null;
  }

  return (
    <Card
      className={`fixed bottom-4 left-4 right-4 z-50 border-primary/20 bg-card/95 backdrop-blur-sm md:left-auto md:max-w-md ${className}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <Download className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-sm">
                Install Wellness Tracker
              </CardTitle>
              <Badge variant="secondary" className="mt-1 text-xs">
                PWA
              </Badge>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription className="text-xs">
          Install our app for a better experience with offline support and quick
          access
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="mb-4 grid grid-cols-3 gap-2 text-xs">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Smartphone className="h-3 w-3" />
            <span>Native feel</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Wifi className="h-3 w-3" />
            <span>Works offline</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Monitor className="h-3 w-3" />
            <span>Fast access</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleInstallClick}
            disabled={isInstalling}
            className="flex-1 text-xs"
            size="sm"
          >
            {isInstalling ? (
              <>
                <div className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Installing...
              </>
            ) : (
              <>
                <Download className="mr-2 h-3 w-3" />
                Install
              </>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={handleRemindLater}
            disabled={isInstalling}
            className="text-xs"
            size="sm"
          >
            Later
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Hook for PWA installation status
export const usePWAInstall = () => {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Check if app is already installed
    const checkIfInstalled = () => {
      if ("getInstalledRelatedApps" in navigator) {
        (navigator as any)
          .getInstalledRelatedApps()
          .then((apps: any[]) => {
            setIsInstalled(apps.length > 0);
          })
          .catch(() => {
            setIsInstalled(
              window.matchMedia("(display-mode: standalone)").matches
            );
          });
      } else {
        setIsInstalled(window.matchMedia("(display-mode: standalone)").matches);
      }
    };

    checkIfInstalled();

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const installEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(installEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) return false;

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;

      if (choiceResult.outcome === "accepted") {
        setDeferredPrompt(null);
        setIsInstallable(false);
        return true;
      }

      return false;
    } catch (error) {
      console.error("Installation failed:", error);
      return false;
    }
  };

  return {
    isInstallable,
    isInstalled,
    installApp,
    canInstall: !!deferredPrompt,
  };
};

export default InstallPrompt;
