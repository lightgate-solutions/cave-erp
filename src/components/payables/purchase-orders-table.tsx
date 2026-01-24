"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Pencil, Trash2, Eye, FileText } from "lucide-react";
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

import { deletePurchaseOrder } from "@/actions/payables/purchase-orders";
import type { POStatus } from "@/types/payables";

interface PurchaseOrder {
  id: number;
  poNumber: string;
  vendorId: number;
  vendorName: string;
  poDate: string;
  expectedDeliveryDate: string | null;
  status: POStatus;
  total: string;
  billedAmount: string;
  receivedAmount: string;
  createdAt: Date;
}

interface PurchaseOrdersTableProps {
  purchaseOrders: PurchaseOrder[];
}

export function PurchaseOrdersTable({
  purchaseOrders,
}: PurchaseOrdersTableProps) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [poToDelete, setPoToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!poToDelete) return;

    setIsDeleting(true);
    try {
      const result = await deletePurchaseOrder(poToDelete);

      if (result.error) {
        toast.error(result.error.reason || "Failed to delete purchase order");
        return;
      }

      toast.success(
        result.success?.reason || "Purchase order deleted successfully",
      );
      router.refresh();
    } catch (error) {
      console.error("Error deleting purchase order:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setPoToDelete(null);
    }
  };

  const getStatusColor = (status: POStatus) => {
    switch (status) {
      case "Draft":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
      case "Pending Approval":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "Approved":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "Sent":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "Partially Received":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "Received":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "Closed":
        return "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200";
      case "Cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (purchaseOrders.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-muted-foreground mb-4">No purchase orders found</p>
        <Button asChild>
          <Link href="/payables/purchase-orders/new">
            Create Your First Purchase Order
          </Link>
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
              <TableHead>PO Number</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>PO Date</TableHead>
              <TableHead>Expected Delivery</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Billed</TableHead>
              <TableHead className="text-right">Unbilled</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {purchaseOrders.map((po) => {
              const unbilled = Number(po.total) - Number(po.billedAmount);
              return (
                <TableRow key={po.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/payables/purchase-orders/${po.id}`}
                      className="hover:underline"
                    >
                      {po.poNumber}
                    </Link>
                  </TableCell>
                  <TableCell>{po.vendorName}</TableCell>
                  <TableCell>
                    {new Date(po.poDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {po.expectedDeliveryDate
                      ? new Date(po.expectedDeliveryDate).toLocaleDateString()
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(po.status)}>
                      {po.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ${Number(po.total).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    ${Number(po.billedAmount).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    {unbilled > 0 ? (
                      <span className="text-orange-600 font-medium">
                        ${unbilled.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-green-600">$0.00</span>
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
                          <Link href={`/payables/purchase-orders/${po.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        {po.status === "Draft" && (
                          <>
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/payables/purchase-orders/${po.id}/edit`}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setPoToDelete(po.id);
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
              This action cannot be undone. Only draft purchase orders can be
              deleted.
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
