"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Pencil, Trash2, Eye, DollarSign } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { deleteBill } from "@/actions/payables/bills";
import type { BillStatus } from "@/types/payables";

interface Bill {
  id: number;
  billNumber: string;
  vendorInvoiceNumber: string;
  vendorId: number;
  vendorName: string;
  billDate: string;
  dueDate: string;
  status: BillStatus;
  total: string;
  amountPaid: string;
  amountDue: string;
  poId: number | null;
  poNumber: string | null;
  createdAt: Date;
}

interface BillsTableProps {
  bills: Bill[];
}

export function BillsTable({ bills }: BillsTableProps) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [billToDelete, setBillToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!billToDelete) return;

    setIsDeleting(true);
    try {
      const result = await deleteBill(billToDelete);

      if (result.error) {
        toast.error(result.error.reason || "Failed to delete bill");
        return;
      }

      toast.success(result.success?.reason || "Bill deleted successfully");
      router.refresh();
    } catch (error) {
      console.error("Error deleting bill:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setBillToDelete(null);
    }
  };

  const getStatusColor = (status: BillStatus) => {
    switch (status) {
      case "Draft":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
      case "Pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "Approved":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "Paid":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "Partially Paid":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "Overdue":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "Cancelled":
        return "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const calculateDaysOverdue = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const diff = Math.floor(
      (today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24),
    );
    return diff > 0 ? diff : 0;
  };

  if (bills.length === 0) {
    return (
      <div className="text-center py-12">
        <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-muted-foreground mb-4">No bills found</p>
        <Button asChild>
          <Link href="/payables/bills/new">Create Your First Bill</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bill Number</TableHead>
              <TableHead>Vendor Invoice#</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Bill Date</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Amount Due</TableHead>
              <TableHead>PO</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bills.map((bill) => {
              const daysOverdue = calculateDaysOverdue(bill.dueDate);
              return (
                <TableRow key={bill.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/payables/bills/${bill.id}`}
                      className="hover:underline"
                    >
                      {bill.billNumber}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm">
                    {bill.vendorInvoiceNumber}
                  </TableCell>
                  <TableCell>{bill.vendorName}</TableCell>
                  <TableCell>
                    {new Date(bill.billDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div>
                      {new Date(bill.dueDate).toLocaleDateString()}
                      {daysOverdue > 0 &&
                        bill.status !== "Paid" &&
                        bill.status !== "Cancelled" && (
                          <div className="text-xs text-red-600">
                            {daysOverdue} days overdue
                          </div>
                        )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(bill.status)}>
                      {bill.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ${Number(bill.total).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    {Number(bill.amountDue) > 0 ? (
                      <span className="font-medium text-orange-600">
                        ${Number(bill.amountDue).toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-green-600">$0.00</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {bill.poNumber ? (
                      <Link
                        href={`/payables/purchase-orders/${bill.poId}`}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        {bill.poNumber}
                      </Link>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link href={`/payables/bills/${bill.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        {bill.status === "Draft" && (
                          <>
                            <DropdownMenuItem asChild>
                              <Link href={`/payables/bills/${bill.id}/edit`}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setBillToDelete(bill.id);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Only draft bills can be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
