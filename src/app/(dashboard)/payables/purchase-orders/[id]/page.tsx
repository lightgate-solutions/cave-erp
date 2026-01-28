import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Edit,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getPurchaseOrder } from "@/actions/payables/purchase-orders";
import { ApprovePurchaseOrderButton } from "@/components/payables/approve-purchase-order-button";

export default async function PurchaseOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const po = await getPurchaseOrder(Number(id));

  if (!po) {
    notFound();
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Approved":
      case "Sent":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "Received":
      case "Partially Received":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "Closed":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
      case "Cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "Pending Approval":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  const getBillStatusColor = (status: string) => {
    switch (status) {
      case "Paid":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "Approved":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "Overdue":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  // Calculate matching progress
  const totalAmount = Number(po.total);
  const receivedAmount = Number(po.receivedAmount);
  const billedAmount = Number(po.billedAmount);
  const receivedPercent =
    totalAmount > 0 ? (receivedAmount / totalAmount) * 100 : 0;
  const billedPercent =
    totalAmount > 0 ? (billedAmount / totalAmount) * 100 : 0;
  const isFullyReceived = receivedPercent >= 100;
  const isFullyBilled = billedPercent >= 100;

  // Use type assertion for status check to fix build error
  const isDraft = po.status === "Draft";
  const isApproved = po.status === "Approved";

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/payables/purchase-orders">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{po.poNumber}</h2>
            <p className="text-muted-foreground">
              Purchase Order for {po.vendor.name}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {isDraft && (
            <>
              <Button variant="outline" asChild>
                <Link href={`/payables/purchase-orders/${po.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </Button>
              <ApprovePurchaseOrderButton poId={po.id} poNumber={po.poNumber} />
            </>
          )}
          {isApproved && (
            <Button asChild>
              <Link href={`/payables/bills/new?poId=${po.id}`}>
                Create Bill from PO
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Status and Matching Progress */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge className={getStatusColor(po.status)}>{po.status}</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Receipt Status
            </CardTitle>
            {isFullyReceived ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : receivedPercent > 0 ? (
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>
                  {po.currency.currencySymbol} {receivedAmount.toLocaleString()}{" "}
                  / {po.currency.currencySymbol}
                  {totalAmount.toLocaleString()}
                </span>
                <span className="text-muted-foreground">
                  {receivedPercent.toFixed(0)}%
                </span>
              </div>
              <Progress value={receivedPercent} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Billing Status
            </CardTitle>
            {isFullyBilled ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : billedPercent > 0 ? (
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>
                  {po.currency.currencySymbol}
                  {billedAmount.toLocaleString()} / {po.currency.currencySymbol}
                  {totalAmount.toLocaleString()}
                </span>
                <span className="text-muted-foreground">
                  {billedPercent.toFixed(0)}%
                </span>
              </div>
              <Progress value={billedPercent} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert for unbilled items */}
      {!isFullyBilled && po.status !== "Cancelled" && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Pending Bills</AlertTitle>
          <AlertDescription>
            This purchase order has unbilled items. Create a bill to complete
            the 3-way matching process.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {/* PO Details */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Purchase Order Details</CardTitle>
            <CardDescription>Information about this PO</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  PO Date
                </div>
                <div className="text-sm">
                  {new Date(po.poDate).toLocaleDateString()}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  Expected Delivery
                </div>
                <div className="text-sm">
                  {po.expectedDeliveryDate
                    ? new Date(po.expectedDeliveryDate).toLocaleDateString()
                    : "-"}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  Currency
                </div>
                <div className="text-sm">
                  {po.currency.currencyCode} - {po.currency.currencyName}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  Total Amount
                </div>
                <div className="text-sm font-bold">
                  {po.currency.currencySymbol}
                  {Number(po.total).toLocaleString()}
                </div>
              </div>
            </div>

            {po.deliveryAddress && (
              <>
                <Separator />
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    Delivery Address
                  </div>
                  <div className="text-sm p-3 bg-muted rounded-md">
                    {po.deliveryAddress}
                  </div>
                </div>
              </>
            )}

            {po.termsAndConditions && (
              <>
                <Separator />
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    Terms and Conditions
                  </div>
                  <div className="text-sm p-3 bg-muted rounded-md">
                    {po.termsAndConditions}
                  </div>
                </div>
              </>
            )}

            {po.notes && (
              <>
                <Separator />
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    Notes
                  </div>
                  <div className="text-sm p-3 bg-muted rounded-md">
                    {po.notes}
                  </div>
                </div>
              </>
            )}

            {po.approvedBy && (
              <>
                <Separator />
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    Approval Information
                  </div>
                  <div className="text-sm">
                    Approved by {po.approvedByUser?.name || po.approvedBy} on{" "}
                    {po.approvedAt && new Date(po.approvedAt).toLocaleString()}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Vendor Information */}
        <Card>
          <CardHeader>
            <CardTitle>Vendor Information</CardTitle>
            <CardDescription>Contact details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                Vendor Name
              </div>
              <Link
                href={`/payables/vendors/${po.vendor.id}`}
                className="text-sm text-blue-600 hover:underline"
              >
                {po.vendor.name}
              </Link>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                Email
              </div>
              <div className="text-sm">{po.vendor.email}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                Phone
              </div>
              <div className="text-sm">{po.vendor.phone || "-"}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Line Items with 3-Way Matching */}
      <Card>
        <CardHeader>
          <CardTitle>Line Items (3-Way Matching)</CardTitle>
          <CardDescription>
            Track ordered, received, and billed quantities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Ordered Qty</TableHead>
                <TableHead className="text-right">Received Qty</TableHead>
                <TableHead className="text-right">Billed Qty</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {po.lineItems.map((item) => {
                const orderedQty = Number(item.quantity);
                const receivedQty = Number(item.receivedQuantity);
                const billedQty = Number(item.billedQuantity);
                const isFullyReceived = receivedQty >= orderedQty;
                const isFullyBilled = billedQty >= orderedQty;

                return (
                  <TableRow key={item.id}>
                    <TableCell>{item.description}</TableCell>
                    <TableCell className="text-right">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={
                          isFullyReceived ? "text-green-600" : "text-orange-600"
                        }
                      >
                        {item.receivedQuantity}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={
                          isFullyBilled ? "text-green-600" : "text-orange-600"
                        }
                      >
                        {item.billedQuantity}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {po.currency.currencySymbol}{" "}
                      {Number(item.unitPrice).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {po.currency.currencySymbol}
                      {Number(item.amount).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center">
                      {isFullyReceived && isFullyBilled ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500 inline" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-yellow-500 inline" />
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              <TableRow>
                <TableCell colSpan={5} className="text-right font-medium">
                  Subtotal:
                </TableCell>
                <TableCell className="text-right font-medium">
                  {po.currency.currencySymbol}{" "}
                  {Number(po.subtotal).toLocaleString()}
                </TableCell>
                <TableCell />
              </TableRow>
              <TableRow>
                <TableCell colSpan={5} className="text-right font-medium">
                  Tax:
                </TableCell>
                <TableCell className="text-right font-medium">
                  {po.currency.currencySymbol}
                  {Number(po.taxAmount).toLocaleString()}
                </TableCell>
                <TableCell />
              </TableRow>
              <TableRow className="bg-muted font-bold">
                <TableCell colSpan={5} className="text-right">
                  Total:
                </TableCell>
                <TableCell className="text-right">
                  {po.currency.currencySymbol}
                  {Number(po.total).toLocaleString()}
                </TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Linked Bills */}
      {po.bills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Linked Bills</CardTitle>
            <CardDescription>
              Bills created from this purchase order ({po.bills.length})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bill Number</TableHead>
                  <TableHead>Vendor Invoice</TableHead>
                  <TableHead>Bill Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {po.bills.map((bill) => (
                  <TableRow key={bill.id}>
                    <TableCell>
                      <Link
                        href={`/payables/bills/${bill.id}`}
                        className="font-medium hover:underline"
                      >
                        {bill.billNumber}
                      </Link>
                    </TableCell>
                    <TableCell>{bill.vendorInvoiceNumber}</TableCell>
                    <TableCell>
                      {new Date(bill.billDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge className={getBillStatusColor(bill.status)}>
                        {bill.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {po.currency.currencySymbol}{" "}
                      {Number(bill.total).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
