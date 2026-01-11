"use client";

import { authClient } from "@/lib/auth-client";

export function useOrganizationLogo(organizationId?: string) {
  const { data: activeOrg } = authClient.useActiveOrganization();
  const { data: orgs } = authClient.useListOrganizations();

  // Use provided ID or active organization
  const targetOrgId = organizationId || activeOrg?.id;

  // Find organization in list
  const org = orgs?.find((o) => o.id === targetOrgId);

  return {
    logoUrl: (org as any)?.logo || null,
    isLoading: !orgs,
    error: null,
  };
}
