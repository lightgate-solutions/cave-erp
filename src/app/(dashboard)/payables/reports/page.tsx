import {
  FileText,
  TrendingUp,
  DollarSign,
  Building2,
  Download,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

import {
  getTaxSummaryReport,
  getVendorAnalytics,
  getPaymentMethodBreakdown,
  getCashFlowForecast,
  getVATReport,
  getWHTReport,
} from "@/actions/payables/analytics";
import { ReportsFilter } from "@/components/payables/reports-filter";

interface ReportsPageProps {
  searchParams: Promise<{
    dateRange?: string;
  }>;
}

export default async function PayablesReportsPage({
  searchParams,
}: ReportsPageProps) {
  const params = await searchParams;
  const dateRange = params.dateRange || "month";

  // Calculate dates
  const now = new Date();
  let startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString(); // Default month
  let endDate = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
  ).toISOString();

  switch (dateRange) {
    case "week": {
      const day = now.getDay();
      const diff = now.getDate() - day;
      const start = new Date(now);
      start.setDate(diff);
      startDate = start.toISOString();
      endDate = now.toISOString();
      break;
    }
    case "quarter": {
      const quarter = Math.floor((now.getMonth() + 3) / 3);
      startDate = new Date(
        now.getFullYear(),
        (quarter - 1) * 3,
        1,
      ).toISOString();
      endDate = new Date(now.getFullYear(), quarter * 3, 0).toISOString();
      break;
    }
    case "year":
      startDate = new Date(now.getFullYear(), 0, 1).toISOString();
      endDate = new Date(now.getFullYear(), 11, 31).toISOString();
      break;
  }

  // Fetch data in parallel
  const [
    taxSummaryData,
    vendorAnalyticsData,
    paymentMethodData,
    cashFlowData,
    vatReportData,
    whtReportData,
  ] = await Promise.all([
    getTaxSummaryReport(undefined, startDate, endDate),
    getVendorAnalytics(10),
    getPaymentMethodBreakdown(),
    getCashFlowForecast(3),
    getVATReport(startDate, endDate),
    getWHTReport(startDate, endDate),
  ]);

  // Process Tax Summary
  const totalTax = taxSummaryData.reduce(
    (sum, item) => sum + Number(item.totalTaxAmount),
    0,
  );
  const vatTotal = vatReportData.reduce(
    (sum, item) => sum + Number(item.taxAmount),
    0,
  );
  const whtTotal = whtReportData.reduce(
    (sum, item) => sum + Number(item.taxAmount),
    0,
  );

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <ReportsFilter />

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tax</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₦{totalTax.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground capitalize">
              {dateRange}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Vendor</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold truncate">
              {vendorAnalyticsData.topVendors[0]?.vendorName || "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">
              ₦
              {Number(
                vendorAnalyticsData.topVendors[0]?.totalSpend || 0,
              ).toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Spend/Vendor
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₦{Number(vendorAnalyticsData.avgSpendPerVendor).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Across all vendors</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Primary Method
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {paymentMethodData[0]?.paymentMethod || "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">
              {paymentMethodData.length > 0
                ? (
                    (Number(paymentMethodData[0].paymentCount) /
                      paymentMethodData.reduce(
                        (acc, curr) => acc + Number(curr.paymentCount),
                        0,
                      )) *
                    100
                  ).toFixed(1)
                : 0}
              % of payments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Reports Tabs */}
      <Tabs defaultValue="tax" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tax">Tax Reports</TabsTrigger>
          <TabsTrigger value="vendors">Vendor Analytics</TabsTrigger>
          <TabsTrigger value="payments">Payment Analysis</TabsTrigger>
          <TabsTrigger value="forecast">Cash Flow Forecast</TabsTrigger>
        </TabsList>

        {/* Tax Reports Tab */}
        <TabsContent value="tax" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Tax Summary Report</CardTitle>
                  <CardDescription>
                    Breakdown of all tax types for the selected period
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tax Type</TableHead>
                    <TableHead>Tax Name</TableHead>
                    <TableHead className="text-right">Bill Count</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {taxSummaryData.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center py-4 text-muted-foreground"
                      >
                        No tax data found for this period
                      </TableCell>
                    </TableRow>
                  ) : (
                    taxSummaryData.map((tax, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Badge>{tax.taxType}</Badge>
                        </TableCell>
                        <TableCell>{tax.taxName}</TableCell>
                        <TableCell className="text-right">
                          {tax.billCount}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ₦{Number(tax.totalTaxAmount).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                  <TableRow className="bg-muted font-bold">
                    <TableCell colSpan={3}>Total Tax</TableCell>
                    <TableCell className="text-right">
                      ₦{totalTax.toLocaleString()}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>VAT Report</CardTitle>
                <CardDescription>Value Added Tax summary</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total VAT</span>
                    <span className="text-2xl font-bold">
                      ₦{vatTotal.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>{vatReportData.length} bills with VAT applied</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>WHT Report</CardTitle>
                <CardDescription>Withholding Tax summary</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total WHT</span>
                    <span className="text-2xl font-bold">
                      ₦{whtTotal.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>{whtReportData.length} bills with WHT applied</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Vendor Analytics Tab */}
        <TabsContent value="vendors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Vendors by Spend</CardTitle>
              <CardDescription>
                Highest spending vendors in the selected period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Vendor Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Bill Count</TableHead>
                    <TableHead className="text-right">Total Spent</TableHead>
                    <TableHead className="text-right">
                      Avg Payment Time
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendorAnalyticsData.topVendors.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-4 text-muted-foreground"
                      >
                        No vendor data available
                      </TableCell>
                    </TableRow>
                  ) : (
                    vendorAnalyticsData.topVendors.map((vendor, index) => (
                      <TableRow key={vendor.vendorId}>
                        <TableCell className="font-bold">{index + 1}</TableCell>
                        <TableCell className="font-medium">
                          {vendor.vendorName}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{vendor.category}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {vendor.billCount}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ₦{Number(vendor.totalSpend).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          - {/* Needs implementation if data available */}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Analysis Tab */}
        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Method Breakdown</CardTitle>
              <CardDescription>
                Distribution of payment methods used
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payment Method</TableHead>
                    <TableHead className="text-right">Payment Count</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                    <TableHead className="text-right">Percentage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentMethodData.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center py-4 text-muted-foreground"
                      >
                        No payment data available
                      </TableCell>
                    </TableRow>
                  ) : (
                    paymentMethodData.map((method) => {
                      const total = paymentMethodData.reduce(
                        (sum, m) => sum + Number(m.paymentCount),
                        0,
                      );
                      const percentage =
                        total > 0
                          ? (Number(method.paymentCount) / total) * 100
                          : 0;

                      return (
                        <TableRow key={method.paymentMethod}>
                          <TableCell>
                            <Badge>{method.paymentMethod}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {method.paymentCount}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ₦{Number(method.totalAmount).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            {percentage.toFixed(1)}%
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                  {paymentMethodData.length > 0 && (
                    <TableRow className="bg-muted font-bold">
                      <TableCell>Total</TableCell>
                      <TableCell className="text-right">
                        {paymentMethodData.reduce(
                          (sum, m) => sum + Number(m.paymentCount),
                          0,
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        ₦
                        {Number(
                          paymentMethodData.reduce(
                            (sum, m) => sum + Number(m.totalAmount),
                            0,
                          ),
                        ).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">100%</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cash Flow Forecast Tab */}
        <TabsContent value="forecast" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>3-Month Cash Flow Forecast</CardTitle>
              <CardDescription>
                Projected outgoing cash flow based on current payables
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead className="text-right">Total Due</TableHead>
                    <TableHead className="text-right">Bill Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cashFlowData.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-center py-4 text-muted-foreground"
                      >
                        No forecast data available
                      </TableCell>
                    </TableRow>
                  ) : (
                    cashFlowData.map((month) => (
                      <TableRow key={month.month}>
                        <TableCell className="font-medium">
                          {month.month}
                        </TableCell>
                        <TableCell className="text-right text-orange-600">
                          ₦{Number(month.totalDue).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {month.billCount}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                  {cashFlowData.length > 0 && (
                    <TableRow className="bg-muted font-bold">
                      <TableCell>Total (3 months)</TableCell>
                      <TableCell className="text-right">
                        ₦
                        {cashFlowData
                          .reduce((sum, m) => sum + Number(m.totalDue), 0)
                          .toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {cashFlowData.reduce(
                          (sum, m) => sum + Number(m.billCount),
                          0,
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
