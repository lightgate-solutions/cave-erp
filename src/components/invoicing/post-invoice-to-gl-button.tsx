"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BookOpen, Loader2 } from "lucide-react";
import { postInvoiceToGL } from "@/actions/invoicing/invoices";
import { toast } from "sonner";
import { useState } from "react";

export function PostInvoiceToGLButton({
  id,
  postedToGl = false,
}: {
  id: number;
  postedToGl?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handlePost = async () => {
    setLoading(true);
    try {
      const result = await postInvoiceToGL(id);
      if (result.success) {
        if (result.alreadyPosted) {
          toast.info("Invoice is already posted to the General Ledger");
        } else {
          toast.success(
            "Posted to General Ledger. Revenue will appear on the Income Statement.",
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
          ? "Already posted when invoice was sent. Click to re-check or post again if needed."
          : "Post this invoice to the General Ledger (also auto-posted when you send the invoice)"
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
