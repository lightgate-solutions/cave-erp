"use client";

import { useEffect, useState } from "react";
import { BetterAuthActionButton } from "@/components/auth/better-auth-action-button";
import { authClient } from "@/lib/auth-client";

export function OrganizationDeletion() {
  const {
    data: organization,
    isPending,
    error,
  } = authClient.useActiveOrganization();
  const [role, setRole] = useState<string>("");

  useEffect(() => {
    async function getRole() {
      const { data } = await authClient.organization.getActiveMemberRole();
      if (!data?.role) return null;
      setRole(data.role);
    }

    getRole();
  }, []);

  if (isPending)
    return (
      <p className="flex justify-center items-center w-full h-full">
        Loading...
      </p>
    );

  if (error)
    return (
      <p className="flex justify-center items-center w-full h-full">
        Error loading dialog !?
      </p>
    );

  if (!organization) return null;

  return (
    <BetterAuthActionButton
      requireAreYouSure
      variant="destructive"
      className="w-full"
      disabled={role !== "owner"}
      successMessage="Organization deletion initiated."
      action={() =>
        authClient.organization.delete({
          organizationId: organization?.id,
        })
      }
    >
      Delete Organization "{organization.name}" and all its Data Permanently
    </BetterAuthActionButton>
  );
}
