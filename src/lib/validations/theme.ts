import { z } from "zod";

export const themeUpdateSchema = z.object({
  theme: z.enum(["light", "dark", "ocean", "forest", "sunset", "system"]),
});

export type ThemeUpdateInput = z.infer<typeof themeUpdateSchema>;
