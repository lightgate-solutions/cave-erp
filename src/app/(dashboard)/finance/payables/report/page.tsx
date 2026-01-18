import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  FileText,
} from "lucide-react";
import { requireFinanceViewAccess } from "@/actions/auth/dal-finance";
import { getAgingReport } from "@/actions/finance/payables/analytics";
import { redirect } from "next/navigation";

export default async function AgingReportPage() {
  try {
    await requireFinanceViewAccess();
  } catch {
    redirect("/");
  }

  const report = await getAgingReport();

  if (!report) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-8 text-muted-foreground">
          <AlertCircle className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p>Unable to load aging report</p>
        </div>
      </div>
    );
  }

  const { buckets, grandTotal, billCount } = report;

  const agingData = [
    {
      label: "Current",
      description: "Not yet due",
      ...buckets.current,
      color: "bg-green-500",
      textColor: "text-green-600",
      icon: CheckCircle,
    },
    {
      label: "1-30 Days",
      description: "Overdue 1-30 days",
      ...buckets.days1to30,
      color: "bg-yellow-500",
      textColor: "text-yellow-600",
      icon: Clock,
    },
    {
      label: "31-60 Days",
      description: "Overdue 31-60 days",
      ...buckets.days31to60,
      color: "bg-orange-500",
      textColor: "text-orange-600",
      icon: AlertTriangle,
    },
    {
      label: "61-90 Days",
      description: "Overdue 61-90 days",
      ...buckets.days61to90,
      color: "bg-red-400",
      textColor: "text-red-500",
      icon: AlertTriangle,
    },
    {
      label: "90+ Days",
      description: "Overdue 90+ days",
      ...buckets.days90plus,
      color: "bg-red-600",
      textColor: "text-red-700",
      icon: AlertCircle,
    },
  ];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Aging Report</h1>
          <p className="text-muted-foreground">
            View accounts payable aging report
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Outstanding
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {grandTotal.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all aging buckets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unpaid Bills</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{billCount}</div>
            <p className="text-xs text-muted-foreground">
              Bills awaiting payment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Overdue Amount
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {(
                buckets.days1to30.total +
                buckets.days31to60.total +
                buckets.days61to90.total +
                buckets.days90plus.total
              ).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-muted-foreground">Past due date</p>
          </CardContent>
        </Card>
      </div>

      {/* Aging Buckets Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Aging Summary</CardTitle>
          <CardDescription>Outstanding payables by age</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {agingData.map((bucket) => {
            const percentage =
              grandTotal > 0 ? (bucket.total / grandTotal) * 100 : 0;
            const Icon = bucket.icon;

            return (
              <div key={bucket.label} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${bucket.textColor}`} />
                    <span className="font-medium">{bucket.label}</span>
                    <span className="text-sm text-muted-foreground">
                      ({bucket.description})
                    </span>
                  </div>
                  <div className="text-right">
                    <span className={`font-bold ${bucket.textColor}`}>
                      {bucket.total.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                    <span className="text-sm text-muted-foreground ml-2">
                      ({bucket.bills.length} bill
                      {bucket.bills.length !== 1 ? "s" : ""})
                    </span>
                  </div>
                </div>
                <Progress value={percentage} className="h-2" />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Detailed Bills by Aging Bucket */}
      {agingData.map((bucket) => {
        if (bucket.bills.length === 0) return null;
        const Icon = bucket.icon;

        return (
          <Card key={bucket.label}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon className={`h-5 w-5 ${bucket.textColor}`} />
                {bucket.label}
                <Badge variant="secondary" className="ml-2">
                  {bucket.bills.length} bill
                  {bucket.bills.length !== 1 ? "s" : ""}
                </Badge>
              </CardTitle>
              <CardDescription>{bucket.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bill #</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Bill Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount Due</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bucket.bills.map((bill) => (
                      <TableRow key={bill.id}>
                        <TableCell>
                          <Link
                            href={`/finance/payables/bills/${bill.id}`}
                            className="text-primary hover:underline font-medium"
                          >
                            {bill.billNumber}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/finance/payables/suppliers/${bill.supplierId}`}
                            className="hover:underline"
                          >
                            {bill.supplierName}
                          </Link>
                        </TableCell>
                        <TableCell>
                          {new Date(bill.billDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {new Date(bill.dueDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              bill.status === "Overdue"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {bill.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {bill.currencySymbol}
                          {Number(bill.amountDue).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Empty State */}
      {billCount === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <CheckCircle className="mx-auto h-12 w-12 mb-4 text-green-500" />
            <p className="text-lg font-medium">All caught up!</p>
            <p className="text-muted-foreground">
              No outstanding bills to report.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
