export const SUPPORTED_OAUTH_PROVIDERS = ["google", "facebook"] as const;
export type SupportedOAuthProvider = (typeof SUPPORTED_OAUTH_PROVIDERS)[number];

export const SUPPORTED_OAUTH_PROVIDER_DETAILS: Record<
  SupportedOAuthProvider,
  { name: string }
> = {
  google: { name: "Google" },
  facebook: { name: "Facebook" },
};
