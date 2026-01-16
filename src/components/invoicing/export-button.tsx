"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";

interface ExportButtonProps {
  invoices: any[];
}

export function ExportButton({ invoices }: ExportButtonProps) {
  const handleExport = () => {
    if (!invoices || invoices.length === 0) {
      toast.error("No invoices to export");
      return;
    }

    const headers = [
      "Invoice Number",
      "Client",
      "Company",
      "Date",
      "Due Date",
      "Status",
      "Amount",
      "Paid",
      "Due",
      "Currency",
    ];

    const rows = invoices.map((inv) => [
      inv.invoiceNumber,
      inv.clientName,
      inv.clientCompanyName || "",
      new Date(inv.invoiceDate).toLocaleDateString(),
      new Date(inv.dueDate).toLocaleDateString(),
      inv.status,
      inv.total,
      inv.amountPaid,
      inv.amountDue,
      inv.currencySymbol,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `invoices_${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV exported successfully");
  };

  return (
    <Button variant="outline" onClick={handleExport}>
      <Download className="mr-2 h-4 w-4" />
      Export CSV
    </Button>
  );
}
