"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BookOpen, Loader2 } from "lucide-react";
import { postBillToGL } from "@/actions/payables/bills";
import { toast } from "sonner";
import { useState } from "react";

export function PostBillToGLButton({
  billId,
  postedToGl = false,
}: {
  billId: number;
  postedToGl?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handlePost = async () => {
    setLoading(true);
    try {
      const result = await postBillToGL(billId);
      if (result.success) {
        if (result.alreadyPosted) {
          toast.info("Bill is already posted to the General Ledger");
        } else {
          toast.success(
            "Posted to General Ledger. Expenses and Accounts Payable updated.",
          );
          router.refresh();
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
      title={
        postedToGl
          ? "Already posted when bill was created. Click to re-check or post again if needed."
          : "Post this bill to the General Ledger (Dr Expense, Cr AP). Also auto-posted when you create the bill."
      }
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <BookOpen className="mr-2 h-4 w-4" />
      )}
      Post to General Ledger
    </Button>
  );
}
