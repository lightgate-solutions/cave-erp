"use client";

import { Moon, Sun, Monitor, Droplets, Trees, Sunset } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const order = ["light", "dark", "ocean", "forest", "sunset", "system"];

  const iconMap: Record<string, React.ReactNode> = {
    light: <Sun className="h-4 w-4" />,
    dark: <Moon className="h-4 w-4" />,
    ocean: <Droplets className="h-4 w-4" />,
    forest: <Trees className="h-4 w-4" />,
    sunset: <Sunset className="h-4 w-4" />,
    system: <Monitor className="h-4 w-4" />,
  };

  const currentIcon = iconMap[theme || "system"] || <Sun className="h-4 w-4" />;

  return (
    <Button
      type="button"
      variant="ghost"
      className="h-8 w-8 p-0 text-primary"
      onClick={() => {
        const currentIndex = order.indexOf(theme || "system");
        const nextIndex = (currentIndex + 1) % order.length;
        setTheme(order[nextIndex]);
      }}
      aria-label={`Switch to ${order[(order.indexOf(theme || "system") + 1) % order.length]} mode`}
    >
      {currentIcon}
    </Button>
  );
}

export default ThemeToggle;
