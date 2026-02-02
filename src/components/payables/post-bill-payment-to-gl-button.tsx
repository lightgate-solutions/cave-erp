"use client";

import { Button } from "@/components/ui/button";
import { BookOpen, Loader2 } from "lucide-react";
import { postBillPaymentToGL } from "@/actions/payables/payments";
import { toast } from "sonner";
import { useState } from "react";

export function PostBillPaymentToGLButton({
  paymentId,
}: {
  paymentId: number;
}) {
  const [loading, setLoading] = useState(false);

  const handlePost = async () => {
    setLoading(true);
    try {
      const result = await postBillPaymentToGL(paymentId);
      if (result.success) {
        if (result.alreadyPosted) {
          toast.info("This payment is already posted to the General Ledger");
        } else {
          toast.success(
            "Posted to General Ledger. Cash and Accounts Payable balances updated.",
          );
        }
      } else {
        toast.error(result.error ?? "Failed to post to GL");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handlePost}
      disabled={loading}
      variant="outline"
      size="sm"
      className="shrink-0 gap-1.5"
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <BookOpen className="h-3.5 w-3.5" />
      )}
      Post to GL
    </Button>
  );
}
