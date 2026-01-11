export const LOGO_CONSTRAINTS = {
  maxSizeBytes: 2 * 1024 * 1024, // 2MB
  acceptedTypes: ["image/png", "image/jpeg", "image/svg+xml"],
  acceptedExtensions: [".png", ".jpg", ".jpeg", ".svg"],
} as const;
