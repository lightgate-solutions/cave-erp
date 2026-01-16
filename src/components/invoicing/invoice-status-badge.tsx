import { cn } from "@/lib/utils";

type InvoiceStatus =
  | "Draft"
  | "Sent"
  | "Paid"
  | "Overdue"
  | "Cancelled"
  | "Partially Paid";

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus;
  className?: string;
}

export function InvoiceStatusBadge({
  status,
  className,
}: InvoiceStatusBadgeProps) {
  const baseClasses =
    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium";

  const statusColors: Record<InvoiceStatus, string> = {
    Paid: "bg-green-100 text-green-800",
    Overdue: "bg-red-100 text-red-800",
    Draft: "bg-gray-100 text-gray-800",
    "Partially Paid": "bg-yellow-100 text-yellow-800",
    Cancelled: "bg-gray-100 text-gray-600",
    Sent: "bg-blue-100 text-blue-800",
  };

  return (
    <span className={cn(baseClasses, statusColors[status], className)}>
      {status}
    </span>
  );
}
