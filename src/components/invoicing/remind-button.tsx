"use client";

import { Button } from "@/components/ui/button";
import { Bell, Loader2 } from "lucide-react";
import { remindInvoice } from "@/actions/invoicing/invoices";
import { toast } from "sonner";
import { useState } from "react";

export function RemindButton({ id }: { id: number }) {
  const [loading, setLoading] = useState(false);

  const handleRemind = async () => {
    setLoading(true);
    try {
      const result = await remindInvoice(id);
      if (result.success) {
        toast.success("Reminder sent successfully");
      } else {
        toast.error(result.error?.reason || "Failed to send reminder");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleRemind} disabled={loading} variant="outline">
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Bell className="mr-2 h-4 w-4" />
      )}
      Remind
    </Button>
  );
}
