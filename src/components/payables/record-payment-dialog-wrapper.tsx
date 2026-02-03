"use client";

import { useState } from "react";
import { DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RecordPaymentDialog } from "./record-payment-dialog";

interface RecordPaymentDialogWrapperProps {
  billId: number;
  billNumber: string;
  vendorName: string;
  amountDue: number;
}

export function RecordPaymentDialogWrapper({
  billId,
  billNumber,
  vendorName,
  amountDue,
}: RecordPaymentDialogWrapperProps) {
  const [open, setOpen] = useState(false);

  if (amountDue <= 0) {
    return null;
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <DollarSign className="mr-2 h-4 w-4" />
        Record Payment
      </Button>

      <RecordPaymentDialog
        billId={billId}
        billNumber={billNumber}
        vendorName={vendorName}
        amountDue={amountDue}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
