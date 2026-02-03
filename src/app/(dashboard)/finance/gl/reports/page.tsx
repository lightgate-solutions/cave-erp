"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Loader2,
  FileText,
  Download,
  FileSpreadsheet,
  FileType,
} from "lucide-react";
import {
  getTrialBalance,
  getIncomeStatement,
  getBalanceSheet,
  type TrialBalanceItem,
} from "@/actions/finance/gl/reports";

interface IncomeStatementData {
  revenue: TrialBalanceItem[];
  expenses: TrialBalanceItem[];
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
}

interface BalanceSheetData {
  assets: TrialBalanceItem[];
  liabilities: TrialBalanceItem[];
  equity: TrialBalanceItem[];
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  retainedEarnings: number;
}
import { DatePickerWithRange } from "@/components/finance/date-range-picker";
import { authClient } from "@/lib/auth-client";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import {
  exportTrialBalanceToCSV,
  exportTrialBalanceToPDF,
  exportIncomeStatementToCSV,
  exportIncomeStatementToPDF,
  exportBalanceSheetToCSV,
  exportBalanceSheetToPDF,
} from "@/lib/finance-report-export";
import { toast } from "sonner";

export default function FinancialReportsPage() {
  const { data: session } = authClient.useSession();
  const organizationId = session?.session?.activeOrganizationId;
  const [activeTab, setActiveTab] = useState("trial-balance");
  const [isLoading, setIsLoading] = useState(false);

  // Data State
  const [trialBalance, setTrialBalance] = useState<TrialBalanceItem[]>([]);
  const [incomeStatement, setIncomeStatement] =
    useState<IncomeStatementData | null>(null);
  const [balanceSheet, setBalanceSheet] = useState<BalanceSheetData | null>(
    null,
  );

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  });

  const loadData = useCallback(async () => {
    if (!organizationId) return;
    setIsLoading(true);
    try {
      const start =
        dateRange?.from ??
        new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const end = dateRange?.to ?? new Date();
      if (activeTab === "trial-balance") {
        const res = await getTrialBalance(organizationId, start, end);
        if (res.success) setTrialBalance(res.data || []);
      } else if (activeTab === "income-statement") {
        const res = await getIncomeStatement(organizationId, start, end);
        if (res.success) setIncomeStatement(res.data ?? null);
      } else if (activeTab === "balance-sheet") {
        const res = await getBalanceSheet(organizationId, end);
        if (res.success) setBalanceSheet(res.data ?? null);
      }
    } catch (error) {
      console.error(error);
    }
    setIsLoading(false);
  }, [activeTab, dateRange, organizationId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const startDate =
    dateRange?.from ??
    new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const endDate = dateRange?.to ?? new Date();

  const handleExportTrialBalanceCSV = () => {
    if (trialBalance.length === 0) {
      toast.error("No data to export");
      return;
    }
    exportTrialBalanceToCSV(trialBalance, startDate, endDate);
    toast.success("Trial Balance exported as CSV");
  };
  const handleExportTrialBalancePDF = async () => {
    if (trialBalance.length === 0) {
      toast.error("No data to export");
      return;
    }
    await exportTrialBalanceToPDF(trialBalance, startDate, endDate);
    toast.success("Trial Balance exported as PDF");
  };
  const handleExportIncomeStatementCSV = () => {
    if (!incomeStatement) {
      toast.error("No data to export");
      return;
    }
    exportIncomeStatementToCSV(incomeStatement, startDate, endDate);
    toast.success("Income Statement exported as CSV");
  };
  const handleExportIncomeStatementPDF = async () => {
    if (!incomeStatement) {
      toast.error("No data to export");
      return;
    }
    await exportIncomeStatementToPDF(incomeStatement, startDate, endDate);
    toast.success("Income Statement exported as PDF");
  };
  const handleExportBalanceSheetCSV = () => {
    if (!balanceSheet) {
      toast.error("No data to export");
      return;
    }
    exportBalanceSheetToCSV(balanceSheet, endDate);
    toast.success("Balance Sheet exported as CSV");
  };
  const handleExportBalanceSheetPDF = async () => {
    if (!balanceSheet) {
      toast.error("No data to export");
      return;
    }
    await exportBalanceSheetToPDF(balanceSheet, endDate);
    toast.success("Balance Sheet exported as PDF");
  };

  if (!organizationId) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Financial Reports</h1>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              Select an organization to view financial reports.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Financial Reports
          </h1>
          <p className="text-muted-foreground">
            View your key financial statements and reports.
          </p>
        </div>
        <DatePickerWithRange date={dateRange} setDate={setDateRange} />
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="trial-balance">Trial Balance</TabsTrigger>
          <TabsTrigger value="income-statement">Income Statement</TabsTrigger>
          <TabsTrigger value="balance-sheet">Balance Sheet</TabsTrigger>
        </TabsList>

        {isLoading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* TRIAL BALANCE */}
            <TabsContent value="trial-balance">
              <Card>
                <CardHeader className="flex flex-row items-start justify-between space-y-0 gap-4">
                  <div>
                    <CardTitle>Trial Balance</CardTitle>
                    <CardDescription>
                      All account balances for the selected period
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Export
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={handleExportTrialBalanceCSV}>
                        <FileSpreadsheet className="mr-2 h-4 w-4" />
                        Export as CSV
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleExportTrialBalancePDF}>
                        <FileType className="mr-2 h-4 w-4" />
                        Export as PDF
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent>
                  {trialBalance.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <FileText className="h-12 w-12 mb-4 opacity-50" />
                      <p>No trial balance data for this period.</p>
                      <p className="text-sm mt-1">
                        Post journal entries to see balances.
                      </p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Account</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="text-right">Debit</TableHead>
                          <TableHead className="text-right">Credit</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {trialBalance.map((item) => (
                          <TableRow key={item.accountId}>
                            <TableCell>
                              {item.accountCode} - {item.accountName}
                            </TableCell>
                            <TableCell>{item.accountType}</TableCell>
                            <TableCell className="text-right font-mono">
                              {item.totalDebits > 0
                                ? item.totalDebits.toFixed(2)
                                : "-"}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {item.totalCredits > 0
                                ? item.totalCredits.toFixed(2)
                                : "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="font-bold bg-muted/50">
                          <TableCell colSpan={2}>Total</TableCell>
                          <TableCell className="text-right">
                            {trialBalance
                              .reduce((sum, i) => sum + i.totalDebits, 0)
                              .toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            {trialBalance
                              .reduce((sum, i) => sum + i.totalCredits, 0)
                              .toFixed(2)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* INCOME STATEMENT */}
            <TabsContent value="income-statement">
              <Card>
                <CardHeader className="flex flex-row items-start justify-between space-y-0 gap-4">
                  <div>
                    <CardTitle>Income Statement</CardTitle>
                    <CardDescription>
                      Statement of Profit and Loss for{" "}
                      {dateRange?.from ? format(dateRange.from, "PP") : "—"} to{" "}
                      {dateRange?.to ? format(dateRange.to, "PP") : "—"}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Export
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={handleExportIncomeStatementCSV}
                      >
                        <FileSpreadsheet className="mr-2 h-4 w-4" />
                        Export as CSV
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={handleExportIncomeStatementPDF}
                      >
                        <FileType className="mr-2 h-4 w-4" />
                        Export as PDF
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent className="space-y-6">
                  {!incomeStatement ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <FileText className="h-12 w-12 mb-4 opacity-50" />
                      <p>No income statement data for this period.</p>
                    </div>
                  ) : (
                    incomeStatement && (
                      <>
                        <div>
                          <h3 className="font-semibold mb-2">Revenue</h3>
                          <Table>
                            <TableBody>
                              {incomeStatement.revenue.map(
                                (item: TrialBalanceItem) => (
                                  <TableRow key={item.accountId}>
                                    <TableCell>{item.accountName}</TableCell>
                                    <TableCell className="text-right">
                                      {(
                                        item.totalCredits - item.totalDebits
                                      ).toFixed(2)}
                                    </TableCell>
                                  </TableRow>
                                ),
                              )}
                              <TableRow className="font-bold border-t-2">
                                <TableCell>Total Revenue</TableCell>
                                <TableCell className="text-right">
                                  {incomeStatement.totalRevenue.toFixed(2)}
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>

                        <div>
                          <h3 className="font-semibold mb-2">Expenses</h3>
                          <Table>
                            <TableBody>
                              {incomeStatement.expenses.map(
                                (item: TrialBalanceItem) => (
                                  <TableRow key={item.accountId}>
                                    <TableCell>{item.accountName}</TableCell>
                                    <TableCell className="text-right">
                                      {(
                                        item.totalDebits - item.totalCredits
                                      ).toFixed(2)}
                                    </TableCell>
                                  </TableRow>
                                ),
                              )}
                              <TableRow className="font-bold border-t-2">
                                <TableCell>Total Expenses</TableCell>
                                <TableCell className="text-right">
                                  {incomeStatement.totalExpenses.toFixed(2)}
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>

                        <div
                          className={`p-4 rounded-lg flex justify-between items-center text-lg font-bold ${
                            incomeStatement.netIncome >= 0
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          <span>Net Income</span>
                          <span>{incomeStatement.netIncome.toFixed(2)}</span>
                        </div>
                      </>
                    )
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* BALANCE SHEET */}
            <TabsContent value="balance-sheet">
              <Card>
                <CardHeader className="flex flex-row items-start justify-between space-y-0 gap-4">
                  <div>
                    <CardTitle>Balance Sheet</CardTitle>
                    <CardDescription>
                      Financial Position as of{" "}
                      {dateRange?.to
                        ? format(dateRange.to, "PP")
                        : format(new Date(), "PP")}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Export
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={handleExportBalanceSheetCSV}>
                        <FileSpreadsheet className="mr-2 h-4 w-4" />
                        Export as CSV
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleExportBalanceSheetPDF}>
                        <FileType className="mr-2 h-4 w-4" />
                        Export as PDF
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent className="space-y-6">
                  {!balanceSheet ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <FileText className="h-12 w-12 mb-4 opacity-50" />
                      <p>No balance sheet data for this period.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-8">
                      {/* ASSETS */}
                      <div>
                        <h3 className="text-xl font-bold mb-4 border-b pb-2">
                          Assets
                        </h3>
                        <Table>
                          <TableBody>
                            {balanceSheet.assets.map(
                              (item: TrialBalanceItem) => (
                                <TableRow key={item.accountId}>
                                  <TableCell>{item.accountName}</TableCell>
                                  <TableCell className="text-right">
                                    {(
                                      item.totalDebits - item.totalCredits
                                    ).toFixed(2)}
                                  </TableCell>
                                </TableRow>
                              ),
                            )}
                            <TableRow className="font-bold text-lg bg-gray-50">
                              <TableCell>Total Assets</TableCell>
                              <TableCell className="text-right">
                                {balanceSheet.totalAssets.toFixed(2)}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>

                      {/* LIABILITIES & EQUITY */}
                      <div>
                        <h3 className="text-xl font-bold mb-4 border-b pb-2">
                          Liabilities
                        </h3>
                        <Table>
                          <TableBody>
                            {balanceSheet.liabilities.map(
                              (item: TrialBalanceItem) => (
                                <TableRow key={item.accountId}>
                                  <TableCell>{item.accountName}</TableCell>
                                  <TableCell className="text-right">
                                    {(
                                      item.totalCredits - item.totalDebits
                                    ).toFixed(2)}
                                  </TableCell>
                                </TableRow>
                              ),
                            )}
                            <TableRow className="font-bold bg-gray-50">
                              <TableCell>Total Liabilities</TableCell>
                              <TableCell className="text-right">
                                {balanceSheet.totalLiabilities.toFixed(2)}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>

                        <h3 className="text-xl font-bold mb-4 border-b pb-2 mt-8">
                          Equity
                        </h3>
                        <Table>
                          <TableBody>
                            {balanceSheet.equity.map(
                              (item: TrialBalanceItem) => (
                                <TableRow key={item.accountId}>
                                  <TableCell>{item.accountName}</TableCell>
                                  <TableCell className="text-right">
                                    {(
                                      item.totalCredits - item.totalDebits
                                    ).toFixed(2)}
                                  </TableCell>
                                </TableRow>
                              ),
                            )}
                            <TableRow>
                              <TableCell>Retained Earnings</TableCell>
                              <TableCell className="text-right">
                                {balanceSheet.retainedEarnings.toFixed(2)}
                              </TableCell>
                            </TableRow>
                            <TableRow className="font-bold bg-gray-50">
                              <TableCell>Total Equity</TableCell>
                              <TableCell className="text-right">
                                {balanceSheet.totalEquity.toFixed(2)}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>

                        <div className="mt-8 p-4 bg-gray-100 rounded flex justify-between font-bold">
                          <span>Total Liabilities & Equity</span>
                          <span>
                            {(
                              balanceSheet.totalLiabilities +
                              balanceSheet.totalEquity
                            ).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}
