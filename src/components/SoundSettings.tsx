"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
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
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Volume2,
  VolumeX,
  Upload,
  Play,
  Pause,
  Trash2,
  Download,
  Music,
  FileAudio,
  Settings,
  TestTube,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { getUserSettings, saveUserSettings } from "@/lib/backup";

interface SoundFile {
  id: string;
  name: string;
  url: string;
  duration?: number;
  size?: number;
  type: "default" | "custom";
}

// Default notification sounds
const DEFAULT_SOUNDS: SoundFile[] = [
  {
    id: "default",
    name: "Default",
    url: "/sounds/default.mp3",
    type: "default",
  },
  {
    id: "gentle-bell",
    name: "Gentle Bell",
    url: "/sounds/gentle-bell.mp3",
    type: "default",
  },
  {
    id: "soft-chime",
    name: "Soft Chime",
    url: "/sounds/soft-chime.mp3",
    type: "default",
  },
];

export default function SoundSettings() {
  const [settings, setSettings] = useState(getUserSettings());
  const [customSounds, setCustomSounds] = useState<SoundFile[]>([]);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load custom sounds from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("wellness-tracker-custom-sounds");
      if (stored) {
        setCustomSounds(JSON.parse(stored));
      }
    } catch (error) {
      console.warn("Failed to load custom sounds:", error);
    }
  }, []);

  // Save custom sounds to localStorage
  const saveCustomSounds = (sounds: SoundFile[]) => {
    try {
      localStorage.setItem(
        "wellness-tracker-custom-sounds",
        JSON.stringify(sounds)
      );
      setCustomSounds(sounds);
    } catch (error) {
      console.warn("Failed to save custom sounds:", error);
      toast.error("Failed to save custom sounds");
    }
  };

  // Update settings
  const updateSettings = (updates: any) => {
    const newSettings = {
      ...settings,
      sounds: { ...settings.sounds, ...updates },
    };
    setSettings(newSettings);
    saveUserSettings(newSettings);
  };

  // Play sound
  const playSound = async (soundUrl: string, soundId: string) => {
    try {
      if (currentlyPlaying === soundId) {
        // Stop current sound
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
        setCurrentlyPlaying(null);
        return;
      }

      if (audioRef.current) {
        audioRef.current.pause();
      }

      const audio = new Audio(soundUrl);
      audio.volume = settings.sounds.volume;

      audioRef.current = audio;
      setCurrentlyPlaying(soundId);

      audio.onended = () => {
        setCurrentlyPlaying(null);
      };

      audio.onerror = () => {
        setCurrentlyPlaying(null);
        toast.error("Failed to play sound");
      };

      await audio.play();
    } catch (error) {
      console.error("Failed to play sound:", error);
      setCurrentlyPlaying(null);
      toast.error("Failed to play sound");
    }
  };

  const allSounds = [...DEFAULT_SOUNDS, ...customSounds];
  const selectedSound = allSounds.find(
    (s) => s.id === settings.sounds.defaultSound
  );

  return (
    <div className="space-y-6">
      {/* Volume Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Volume & Sound Control
          </CardTitle>
          <CardDescription>
            Configure notification volume and sound preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Master Volume */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Notification Volume</Label>
              <Badge variant="outline">
                {Math.round(settings.sounds.volume * 100)}%
              </Badge>
            </div>
            <div className="flex items-center gap-4">
              <VolumeX className="h-4 w-4 text-muted-foreground" />
              <Slider
                value={[settings.sounds.volume]}
                onValueChange={([value]) => updateSettings({ volume: value })}
                max={1}
                step={0.1}
                className="flex-1"
              />
              <Volume2 className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          <Separator />

          {/* Sound Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Default Notification Sound
            </Label>
            <div className="flex items-center gap-3">
              <Select
                value={settings.sounds.defaultSound}
                onValueChange={(value) =>
                  updateSettings({ defaultSound: value })
                }
              >
                <SelectTrigger className="flex-1">
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      <Music className="h-4 w-4" />
                      {selectedSound?.name || "Select a sound"}
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {DEFAULT_SOUNDS.map((sound) => (
                    <SelectItem key={sound.id} value={sound.id}>
                      <div className="flex items-center gap-2">
                        <Music className="h-4 w-4" />
                        {sound.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  selectedSound &&
                  playSound(selectedSound.url, selectedSound.id)
                }
                disabled={!selectedSound}
              >
                <TestTube className="h-4 w-4 mr-2" />
                Test
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
