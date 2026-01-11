"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";
import useSWR from "swr";
import { toast } from "sonner";
import {
  getUserPreferences,
  updateUserPreferences,
} from "@/actions/user-preferences/preferences";
import type { ThemeId } from "@/config/themes.config";

export function useThemePreference() {
  const { theme: nextTheme, setTheme: setNextTheme } = useTheme();

  const { data, error, mutate, isLoading } = useSWR(
    "user-preferences",
    getUserPreferences,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  );

  // Sync DB theme with next-themes on mount
  useEffect(() => {
    if (data?.theme && data.theme !== nextTheme) {
      setNextTheme(data.theme);
    }
  }, [data?.theme, nextTheme, setNextTheme]);

  async function setTheme(newTheme: ThemeId) {
    // Optimistic UI update
    setNextTheme(newTheme);
    if (data) {
      mutate({ ...data, theme: newTheme }, false);
    }

    // Persist to database
    const result = await updateUserPreferences({ theme: newTheme });
    if (!result.success) {
      toast.error(result.error || "Failed to update theme");
      // Revert optimistic update
      setNextTheme(data?.theme || "light");
      mutate();
    } else {
      // Revalidate to ensure sync
      mutate();
    }
  }

  return {
    theme: (data?.theme || nextTheme || "light") as ThemeId,
    setTheme,
    isLoading,
    error,
  };
}
