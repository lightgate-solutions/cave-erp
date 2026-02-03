"use client";

import { useTransition } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { approvePurchaseOrder } from "@/actions/payables/purchase-orders";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ApprovePurchaseOrderButtonProps {
  poId: number;
  poNumber: string;
}

export function ApprovePurchaseOrderButton({
  poId,
  poNumber,
}: ApprovePurchaseOrderButtonProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleApprove = () => {
    startTransition(async () => {
      const result = await approvePurchaseOrder(poId);

      if (result.error) {
        toast.error(result.error.reason || "Failed to approve purchase order");
      } else {
        toast.success(`Purchase order ${poNumber} approved successfully`);
        router.refresh();
      }
    });
  };

  return (
    <Button onClick={handleApprove} disabled={isPending}>
      {isPending ? (
        <>
          <CheckCircle2 className="mr-2 h-4 w-4 animate-spin" />
          Approving...
        </>
      ) : (
        <>
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Approve PO
        </>
      )}
    </Button>
  );
}
