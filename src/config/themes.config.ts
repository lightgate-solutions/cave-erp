export type ThemeId =
  | "light"
  | "dark"
  | "ocean"
  | "forest"
  | "sunset"
  | "system";

export interface ThemeConfig {
  id: Exclude<ThemeId, "system">;
  name: string;
  description: string;
  previewColors: {
    primary: string;
    background: string;
    accent: string;
  };
}

export const THEMES: Record<Exclude<ThemeId, "system">, ThemeConfig> = {
  light: {
    id: "light",
    name: "Light",
    description: "Clean and bright theme for daytime use",
    previewColors: {
      primary: "#1e40af",
      background: "#ffffff",
      accent: "#f3f4f6",
    },
  },
  dark: {
    id: "dark",
    name: "Dark",
    description: "Easy on the eyes for low-light environments",
    previewColors: {
      primary: "#60a5fa",
      background: "#1f2937",
      accent: "#374151",
    },
  },
  ocean: {
    id: "ocean",
    name: "Ocean",
    description: "Calm and serene blue tones",
    previewColors: {
      primary: "#0891b2",
      background: "#f0f9ff",
      accent: "#e0f2fe",
    },
  },
  forest: {
    id: "forest",
    name: "Forest",
    description: "Natural green hues for a refreshing look",
    previewColors: {
      primary: "#059669",
      background: "#f0fdf4",
      accent: "#dcfce7",
    },
  },
  sunset: {
    id: "sunset",
    name: "Sunset",
    description: "Warm orange and pink tones",
    previewColors: {
      primary: "#ea580c",
      background: "#fff7ed",
      accent: "#fed7aa",
    },
  },
};

export function getAllThemes(): ThemeConfig[] {
  return Object.values(THEMES);
}

export function getThemeConfig(id: ThemeId): ThemeConfig | null {
  if (id === "system") return null;
  return THEMES[id] || null;
}
