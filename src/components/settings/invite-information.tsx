"use client";

import { useRouter } from "next/navigation";
import { BetterAuthActionButton } from "@/components/auth/better-auth-action-button";
import { authClient } from "@/lib/auth-client";
import { acceptInvitationAndCreateEmployee } from "@/actions/organizations";
import { toast } from "sonner";

export function InviteInformation({
  invitation,
}: {
  invitation: { id: string; organizationId: string };
}) {
  const router = useRouter();

  async function acceptInvite() {
    try {
      const result = await acceptInvitationAndCreateEmployee(invitation.id);

      if (!result.success) {
        toast.error(result.error || "Failed to accept invite");
        return {
          error: { message: result.error || "Failed to accept invite" },
        };
      }

      await authClient.organization.setActive({
        organizationId: invitation.organizationId,
      });

      toast.success("Joined organization successfully");
      router.push("/");
      return { error: null };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to accept invite";
      toast.error(message);
      return { error: { message } };
    }
  }
  function rejectInvite() {
    return authClient.organization.rejectInvitation(
      {
        invitationId: invitation.id,
      },
      { onSuccess: () => router.push("/") },
    );
  }

  return (
    <div className="flex gap-4">
      <BetterAuthActionButton className="flex-grow" action={acceptInvite}>
        Accept
      </BetterAuthActionButton>
      <BetterAuthActionButton
        className="flex-grow"
        variant="destructive"
        action={rejectInvite}
      >
        Reject
      </BetterAuthActionButton>
    </div>
  );
}
