"use client";

import { Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { acceptInvitationAndCreateEmployee } from "@/actions/organizations";

export function InviteActions({
  inviteId,
  orgId,
}: {
  inviteId: string;
  orgId: string;
}) {
  const router = useRouter();

  const handleAccept = async () => {
    try {
      const result = await acceptInvitationAndCreateEmployee(inviteId);

      if (!result.success) {
        toast.error(result.error || "Failed to accept invite");
        return;
      }

      await authClient.organization.setActive({
        organizationId: orgId,
      });

      toast.success("Joined organization successfully");
      setTimeout(() => {
        router.push("/");
      }, 1000);
    } catch (_err) {
      toast.error("Failed to accept invite");
    }
  };

  const handleReject = async () => {
    await authClient.organization.rejectInvitation(
      {
        invitationId: inviteId,
      },
      {
        onError: (err) => {
          toast.error(err.error.message || "Failed to reject invite");
        },
        onSuccess: async () => {
          toast.success("Rejected organization invite successfully");
          setTimeout(() => {
            router.push("/");
          }, 1000);
        },
      },
    );
  };

  return (
    <div className="flex gap-2 md:flex-col lg:flex-row">
      <Button
        onClick={handleAccept}
        className="flex-1 md:flex-none bg-primary hover:bg-primary/90 text-primary-foreground"
      >
        <Check className="w-4 h-4 mr-2" />
        Accept
      </Button>
      <Button
        onClick={handleReject}
        variant="outline"
        className="flex-1 md:flex-none"
      >
        <X className="w-4 h-4 mr-2" />
        Decline
      </Button>
    </div>
  );
}
