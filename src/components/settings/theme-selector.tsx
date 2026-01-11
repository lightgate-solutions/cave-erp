"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAllThemes } from "@/config/themes.config";
import type { ThemeId } from "@/config/themes.config";

interface ThemeSelectorProps {
  value: ThemeId;
  onChange: (theme: ThemeId) => void;
  disabled?: boolean;
}

export function ThemeSelector({
  value,
  onChange,
  disabled,
}: ThemeSelectorProps) {
  const themes = getAllThemes();

  return (
    <div className="space-y-2">
      <Label htmlFor="theme-select">Theme Preference</Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger id="theme-select">
          <SelectValue placeholder="Select a theme" />
        </SelectTrigger>
        <SelectContent>
          {themes.map((theme) => (
            <SelectItem key={theme.id} value={theme.id}>
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div
                    className="w-4 h-4 rounded-full border"
                    style={{ backgroundColor: theme.previewColors.primary }}
                  />
                  <div
                    className="w-4 h-4 rounded-full border"
                    style={{ backgroundColor: theme.previewColors.background }}
                  />
                  <div
                    className="w-4 h-4 rounded-full border"
                    style={{ backgroundColor: theme.previewColors.accent }}
                  />
                </div>
                <span>{theme.name}</span>
              </div>
            </SelectItem>
          ))}
          <SelectItem value="system">
            <span>System</span>
          </SelectItem>
        </SelectContent>
      </Select>
      <p className="text-sm text-muted-foreground">
        Choose your preferred color theme
      </p>
    </div>
  );
}
