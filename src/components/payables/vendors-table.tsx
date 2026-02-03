"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Pencil, Trash2, Eye } from "lucide-react";
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

import { deleteVendor } from "@/actions/payables/vendors";
import type { VendorStatus } from "@/types/payables";

interface Vendor {
  id: number;
  vendorCode: string;
  name: string;
  email: string;
  phone: string | null;
  companyName: string | null;
  category: string;
  customCategory: string | null;
  status: VendorStatus;
  defaultPaymentTerms: string | null;
  createdAt: Date;
  billCount: number;
  totalOutstanding: string;
}

interface VendorsTableProps {
  vendors: Vendor[];
}

export function VendorsTable({ vendors }: VendorsTableProps) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [vendorToDelete, setVendorToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!vendorToDelete) return;

    setIsDeleting(true);
    try {
      const result = await deleteVendor(vendorToDelete);

      if (result.error) {
        toast.error(result.error.reason || "Failed to delete vendor");
        return;
      }

      toast.success(result.success?.reason || "Vendor deleted successfully");
      router.refresh();
    } catch (error) {
      console.error("Error deleting vendor:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setVendorToDelete(null);
    }
  };

  const getStatusColor = (status: VendorStatus) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "Inactive":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
      case "Suspended":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "Archived":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (vendors.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">No vendors found</p>
        <Button asChild>
          <Link href="/payables/vendors/new">Create Your First Vendor</Link>
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
              <TableHead>Vendor Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Bills</TableHead>
              <TableHead className="text-right">Outstanding</TableHead>
              <TableHead>Payment Terms</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vendors.map((vendor) => (
              <TableRow key={vendor.id}>
                <TableCell className="font-medium">
                  {vendor.vendorCode}
                </TableCell>
                <TableCell>
                  <div>
                    <Link
                      href={`/payables/vendors/${vendor.id}`}
                      className="font-medium hover:underline"
                    >
                      {vendor.name}
                    </Link>
                    <div className="text-sm text-muted-foreground">
                      {vendor.email}
                    </div>
                  </div>
                </TableCell>
                <TableCell>{vendor.companyName || "-"}</TableCell>
                <TableCell>
                  {vendor.category === "Custom"
                    ? vendor.customCategory
                    : vendor.category}
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(vendor.status)}>
                    {vendor.status}
                  </Badge>
                </TableCell>
                <TableCell>{vendor.billCount}</TableCell>
                <TableCell className="text-right font-medium">
                  {Number(vendor.totalOutstanding) > 0
                    ? `$${Number(vendor.totalOutstanding).toFixed(2)}`
                    : "-"}
                </TableCell>
                <TableCell>{vendor.defaultPaymentTerms || "-"}</TableCell>
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
                        <Link href={`/payables/vendors/${vendor.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/payables/vendors/${vendor.id}/edit`}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => {
                          setVendorToDelete(vendor.id);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. If the vendor has existing bills,
              the vendor will be marked as inactive instead of being deleted.
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
