"use client";

import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";
import { sendInvoice } from "@/actions/invoicing/invoices";
import { toast } from "sonner";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function SendInvoiceButton({ id }: { id: number }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSend = async () => {
    setLoading(true);
    try {
      const result = await sendInvoice(id);
      if (result.success) {
        toast.success("Invoice sent successfully");
        router.refresh();
      } else {
        toast.error(result.error?.reason || "Failed to send invoice");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleSend} disabled={loading}>
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Send className="mr-2 h-4 w-4" />
      )}
      Send Invoice
    </Button>
  );
}
