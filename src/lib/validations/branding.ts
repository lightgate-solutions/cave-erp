import { z } from "zod";
import { LOGO_CONSTRAINTS } from "@/config/branding.config";

export const logoUploadSchema = z.object({
  file: z
    .custom<File>()
    .refine(
      (file) => file.size <= LOGO_CONSTRAINTS.maxSizeBytes,
      `File must be under ${LOGO_CONSTRAINTS.maxSizeBytes / (1024 * 1024)}MB`,
    )
    .refine(
      (file) =>
        (LOGO_CONSTRAINTS.acceptedTypes as readonly string[]).includes(
          file.type,
        ),
      "Only PNG, JPG, and SVG files are accepted",
    ),
});

export type LogoUploadInput = z.infer<typeof logoUploadSchema>;

export function validateLogoFile(file: File): {
  valid: boolean;
  error?: string;
} {
  const result = logoUploadSchema.safeParse({ file });
  if (!result.success) {
    return { valid: false, error: result.error.issues[0].message };
  }
  return { valid: true };
}
