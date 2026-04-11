"use client";

import {
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
  useMemo,
} from "react";
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
  getCashFlowStatement,
  type TrialBalanceItem,
  type IncomeStatementReport,
  type CashFlowStatementData,
} from "@/actions/finance/gl/reports";

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
  classicTrialBalanceDebitCredit,
  formatTrialBalanceFigure,
  formatIncomeStatementRevenue,
  formatIncomeStatementProfit,
  formatIncomeStatementExpenseParens,
  exportTrialBalanceToCSV,
  exportTrialBalanceToPDF,
  exportIncomeStatementToCSV,
  exportIncomeStatementToPDF,
  exportBalanceSheetToCSV,
  exportBalanceSheetToPDF,
} from "@/lib/finance-report-export";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

/** Old server payloads or race conditions may omit arrays — avoid runtime errors. */
function normalizeIncomeStatement(
  d: IncomeStatementReport | null | undefined,
): IncomeStatementReport | null {
  if (d == null || typeof d !== "object") return null;
  const o = d as Record<string, unknown>;
  return {
    revenue: Array.isArray(o.revenue) ? o.revenue : [],
    costOfGoodsSold: Array.isArray(o.costOfGoodsSold) ? o.costOfGoodsSold : [],
    operatingExpenses: Array.isArray(o.operatingExpenses)
      ? o.operatingExpenses
      : [],
    totalRevenue: Number(o.totalRevenue) || 0,
    totalCogs: Number(o.totalCogs) || 0,
    grossProfit: Number(o.grossProfit) || 0,
    totalOperatingExpenses: Number(o.totalOperatingExpenses) || 0,
    totalExpenses: Number(o.totalExpenses) || 0,
    netIncome: Number(o.netIncome) || 0,
  };
}

function coerceTbLineArray(value: unknown): TrialBalanceItem[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (row): row is TrialBalanceItem =>
      row != null &&
      typeof row === "object" &&
      "accountId" in row &&
      typeof (row as TrialBalanceItem).accountId === "number",
  );
}

export default function FinancialReportsPage() {
  const { data: session } = authClient.useSession();
  const organizationId = session?.session?.activeOrganizationId;
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("trial-balance");
  const [isLoading, setIsLoading] = useState(false);

  // Data State
  const [trialBalance, setTrialBalance] = useState<TrialBalanceItem[]>([]);
  const [incomeStatement, setIncomeStatement] =
    useState<IncomeStatementReport | null>(null);
  const [balanceSheet, setBalanceSheet] = useState<BalanceSheetData | null>(
    null,
  );
  const [cashFlow, setCashFlow] = useState<CashFlowStatementData | null>(null);

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Clear stale GL report state before paint when org changes (avoids one frame of stale .map data).
  useLayoutEffect(() => {
    void organizationId;
    setTrialBalance([]);
    setIncomeStatement(null);
    setBalanceSheet(null);
    setCashFlow(null);
  }, [organizationId]);

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
        if (res.success)
          setIncomeStatement(normalizeIncomeStatement(res.data ?? null));
      } else if (activeTab === "balance-sheet") {
        const res = await getBalanceSheet(organizationId, end);
        if (res.success) setBalanceSheet(res.data ?? null);
      } else if (activeTab === "cash-flow") {
        const res = await getCashFlowStatement(organizationId, start, end);
        if (res.success) setCashFlow(res.data ?? null);
        else setCashFlow(null);
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

  const trialBalanceRows = useMemo(
    () =>
      trialBalance.filter((item) => {
        const { debit, credit } = classicTrialBalanceDebitCredit(item);
        return debit > 1e-6 || credit > 1e-6;
      }),
    [trialBalance],
  );

  const incomeStatementSafe = useMemo(
    () => normalizeIncomeStatement(incomeStatement),
    [incomeStatement],
  );

  const plRevenue = coerceTbLineArray(incomeStatementSafe?.revenue);
  const plCogs = coerceTbLineArray(incomeStatementSafe?.costOfGoodsSold);
  const plOperating = coerceTbLineArray(incomeStatementSafe?.operatingExpenses);

  const trialBalanceTotals = useMemo(() => {
    let debits = 0;
    let credits = 0;
    for (const item of trialBalance) {
      const { debit, credit } = classicTrialBalanceDebitCredit(item);
      debits += debit;
      credits += credit;
    }
    return { debits, credits };
  }, [trialBalance]);

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
    const pl = normalizeIncomeStatement(incomeStatement);
    if (!pl) {
      toast.error("No data to export");
      return;
    }
    exportIncomeStatementToCSV(pl, startDate, endDate);
    toast.success("Income Statement exported as CSV");
  };
  const handleExportIncomeStatementPDF = async () => {
    const pl = normalizeIncomeStatement(incomeStatement);
    if (!pl) {
      toast.error("No data to export");
      return;
    }
    await exportIncomeStatementToPDF(pl, startDate, endDate);
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

  const showOrgChrome = mounted && Boolean(organizationId);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Financial Reports
          </h1>
          <p className="text-muted-foreground min-h-[1.25rem]">
            {organizationId
              ? "View your key financial statements and reports."
              : "Select an organization to view financial reports."}
          </p>
        </div>
        {showOrgChrome ? (
          <DatePickerWithRange date={dateRange} setDate={setDateRange} />
        ) : null}
      </div>

      {mounted && !organizationId ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              Choose an organization from the workspace switcher to load
              reports.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {showOrgChrome ? (
        <Tabs
          key={organizationId ?? "no-org"}
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList className="flex flex-wrap h-auto gap-1">
            <TabsTrigger value="trial-balance">Trial Balance</TabsTrigger>
            <TabsTrigger value="income-statement">Income Statement</TabsTrigger>
            <TabsTrigger value="balance-sheet">Balance Sheet</TabsTrigger>
            <TabsTrigger value="cash-flow">Cash Flow</TabsTrigger>
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
                        Closing balances through the selected period (posted
                        journals only). Debit and credit columns list each
                        account&apos;s net position; column totals should match.
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
                    ) : trialBalanceRows.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <FileText className="h-12 w-12 mb-4 opacity-50" />
                        <p>No account balances for this period.</p>
                        <p className="text-sm mt-1">
                          Post journals or widen the date range.
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="min-w-[200px]">
                                Account
                              </TableHead>
                              <TableHead className="text-right min-w-[120px]">
                                Debit
                              </TableHead>
                              <TableHead className="text-right min-w-[120px]">
                                Credit
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {trialBalanceRows.map((item) => {
                              const { debit, credit } =
                                classicTrialBalanceDebitCredit(item);
                              return (
                                <TableRow key={item.accountId}>
                                  <TableCell className="whitespace-nowrap">
                                    {item.accountCode} – {item.accountName}
                                  </TableCell>
                                  <TableCell className="text-right font-mono text-sm tabular-nums">
                                    {debit > 0
                                      ? formatTrialBalanceFigure(debit)
                                      : ""}
                                  </TableCell>
                                  <TableCell className="text-right font-mono text-sm tabular-nums">
                                    {credit > 0
                                      ? formatTrialBalanceFigure(credit)
                                      : ""}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                            <TableRow className="font-bold bg-muted/50">
                              <TableCell>TOTAL</TableCell>
                              <TableCell className="text-right font-mono text-sm tabular-nums">
                                {formatTrialBalanceFigure(
                                  trialBalanceTotals.debits,
                                )}
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm tabular-nums">
                                {formatTrialBalanceFigure(
                                  trialBalanceTotals.credits,
                                )}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    )}
                    {trialBalance.length > 0 ? (
                      <p
                        className={`mt-3 text-sm ${
                          Math.abs(
                            trialBalanceTotals.debits -
                              trialBalanceTotals.credits,
                          ) < 0.02
                            ? "text-muted-foreground"
                            : "text-destructive font-medium"
                        }`}
                      >
                        Debits ={" "}
                        {formatTrialBalanceFigure(trialBalanceTotals.debits)} ·
                        Credits ={" "}
                        {formatTrialBalanceFigure(trialBalanceTotals.credits)}
                        {Math.abs(
                          trialBalanceTotals.debits -
                            trialBalanceTotals.credits,
                        ) < 0.02
                          ? " — balanced."
                          : " — out of balance; check posted journals."}
                      </p>
                    ) : null}
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
                        {dateRange?.from ? format(dateRange.from, "PP") : "—"}{" "}
                        to {dateRange?.to ? format(dateRange.to, "PP") : "—"}
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
                  <CardContent>
                    {!incomeStatementSafe ? (
                      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <FileText className="h-12 w-12 mb-4 opacity-50" />
                        <p>No income statement data for this period.</p>
                      </div>
                    ) : (
                      <div className="max-w-lg space-y-0 text-sm">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                          Revenue
                        </p>
                        <div className="space-y-1.5">
                          {plRevenue.map((item) => {
                            const amt = item.totalCredits - item.totalDebits;
                            return (
                              <div
                                key={item.accountId}
                                className="grid grid-cols-[1fr_minmax(7rem,auto)] gap-x-6 tabular-nums"
                              >
                                <span>{item.accountName}</span>
                                <span className="text-right">
                                  {formatIncomeStatementRevenue(amt)}
                                </span>
                              </div>
                            );
                          })}
                          {plRevenue.length > 1 ? (
                            <div className="grid grid-cols-[1fr_minmax(7rem,auto)] gap-x-6 font-medium tabular-nums pt-1">
                              <span>Total Revenue</span>
                              <span className="text-right">
                                {formatIncomeStatementRevenue(
                                  incomeStatementSafe.totalRevenue,
                                )}
                              </span>
                            </div>
                          ) : null}
                        </div>

                        {plCogs.length > 0 ? (
                          <>
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-6 mb-3">
                              Cost of Goods Sold
                            </p>
                            <div className="space-y-1.5">
                              {plCogs.map((item) => {
                                const amt =
                                  item.totalDebits - item.totalCredits;
                                return (
                                  <div
                                    key={item.accountId}
                                    className="grid grid-cols-[1fr_minmax(7rem,auto)] gap-x-6 tabular-nums"
                                  >
                                    <span>{item.accountName}</span>
                                    <span className="text-right">
                                      {formatIncomeStatementExpenseParens(amt)}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        ) : null}

                        <Separator className="my-4" />

                        <div className="grid grid-cols-[1fr_minmax(7rem,auto)] gap-x-6 font-semibold tabular-nums">
                          <span>Gross Profit</span>
                          <span className="text-right">
                            {formatIncomeStatementProfit(
                              incomeStatementSafe.grossProfit,
                            )}
                          </span>
                        </div>

                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-8 mb-3">
                          Expenses
                        </p>
                        <div className="space-y-1.5">
                          {plOperating.length === 0 ? (
                            <p className="text-muted-foreground text-xs">
                              No operating expenses in this period.
                            </p>
                          ) : (
                            plOperating.map((item) => {
                              const amt = item.totalDebits - item.totalCredits;
                              return (
                                <div
                                  key={item.accountId}
                                  className="grid grid-cols-[1fr_minmax(7rem,auto)] gap-x-6 tabular-nums"
                                >
                                  <span>{item.accountName}</span>
                                  <span className="text-right">
                                    {formatIncomeStatementExpenseParens(amt)}
                                  </span>
                                </div>
                              );
                            })
                          )}
                        </div>

                        <Separator className="my-4" />

                        <div
                          className={cn(
                            "grid grid-cols-[1fr_minmax(7rem,auto)] gap-x-6 font-bold text-base tabular-nums py-2 rounded-md px-2 -mx-2",
                            incomeStatementSafe.netIncome >= 0
                              ? "bg-green-100/80 text-green-900 dark:bg-green-950/40 dark:text-green-100"
                              : "bg-red-100/80 text-red-900 dark:bg-red-950/40 dark:text-red-100",
                          )}
                        >
                          <span>Net Profit</span>
                          <span className="text-right">
                            {formatIncomeStatementProfit(
                              incomeStatementSafe.netIncome,
                            )}
                          </span>
                        </div>
                      </div>
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
                      <div className="grid gap-6 md:grid-cols-2">
                        {/* ASSETS */}
                        <div className="rounded-xl border border-border bg-muted/40 p-5 shadow-sm">
                          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4 border-b border-border pb-2">
                            Assets
                          </h3>
                          <div className="overflow-hidden rounded-lg border border-border/60 bg-background/40">
                            <Table>
                              <TableBody>
                                {balanceSheet.assets.map(
                                  (item: TrialBalanceItem) => (
                                    <TableRow key={item.accountId}>
                                      <TableCell className="text-foreground">
                                        {item.accountName}
                                      </TableCell>
                                      <TableCell className="text-right font-mono tabular-nums">
                                        {(
                                          item.totalDebits - item.totalCredits
                                        ).toFixed(2)}
                                      </TableCell>
                                    </TableRow>
                                  ),
                                )}
                                <TableRow className="border-t border-border bg-muted/50 font-semibold hover:bg-muted/50">
                                  <TableCell>Total Assets</TableCell>
                                  <TableCell className="text-right font-mono tabular-nums text-base">
                                    {balanceSheet.totalAssets.toFixed(2)}
                                  </TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </div>
                        </div>

                        {/* LIABILITIES & EQUITY */}
                        <div className="rounded-xl border border-border bg-muted/40 p-5 shadow-sm space-y-8">
                          <div>
                            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4 border-b border-border pb-2">
                              Liabilities
                            </h3>
                            <div className="overflow-hidden rounded-lg border border-border/60 bg-background/40">
                              <Table>
                                <TableBody>
                                  {balanceSheet.liabilities.map(
                                    (item: TrialBalanceItem) => (
                                      <TableRow key={item.accountId}>
                                        <TableCell className="text-foreground">
                                          {item.accountName}
                                        </TableCell>
                                        <TableCell className="text-right font-mono tabular-nums">
                                          {(
                                            item.totalCredits - item.totalDebits
                                          ).toFixed(2)}
                                        </TableCell>
                                      </TableRow>
                                    ),
                                  )}
                                  <TableRow className="border-t border-border bg-muted/50 font-semibold hover:bg-muted/50">
                                    <TableCell>Total Liabilities</TableCell>
                                    <TableCell className="text-right font-mono tabular-nums">
                                      {balanceSheet.totalLiabilities.toFixed(2)}
                                    </TableCell>
                                  </TableRow>
                                </TableBody>
                              </Table>
                            </div>
                          </div>

                          <div>
                            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4 border-b border-border pb-2">
                              Equity
                            </h3>
                            <div className="overflow-hidden rounded-lg border border-border/60 bg-background/40">
                              <Table>
                                <TableBody>
                                  {balanceSheet.equity.map(
                                    (item: TrialBalanceItem) => (
                                      <TableRow key={item.accountId}>
                                        <TableCell className="text-foreground">
                                          {item.accountName}
                                        </TableCell>
                                        <TableCell className="text-right font-mono tabular-nums">
                                          {(
                                            item.totalCredits - item.totalDebits
                                          ).toFixed(2)}
                                        </TableCell>
                                      </TableRow>
                                    ),
                                  )}
                                  <TableRow>
                                    <TableCell>Retained Earnings</TableCell>
                                    <TableCell className="text-right font-mono tabular-nums">
                                      {balanceSheet.retainedEarnings.toFixed(2)}
                                    </TableCell>
                                  </TableRow>
                                  <TableRow className="border-t border-border bg-muted/50 font-semibold hover:bg-muted/50">
                                    <TableCell>Total Equity</TableCell>
                                    <TableCell className="text-right font-mono tabular-nums">
                                      {balanceSheet.totalEquity.toFixed(2)}
                                    </TableCell>
                                  </TableRow>
                                </TableBody>
                              </Table>
                            </div>
                          </div>

                          <div className="rounded-lg border border-border bg-muted/60 px-4 py-3 flex justify-between items-center font-semibold text-foreground shadow-sm">
                            <span>Total Liabilities & Equity</span>
                            <span className="font-mono tabular-nums">
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

              <TabsContent value="cash-flow">
                <Card>
                  <CardHeader>
                    <CardTitle>Cash Flow Statement</CardTitle>
                    <CardDescription>
                      Simplified indirect operating cash flow (net income ±
                      working capital for AR 1200 and AP 2000). Extend account
                      mapping for full investing/financing sections.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!cashFlow ? (
                      <p className="text-muted-foreground py-8 text-center">
                        No data for this range.
                      </p>
                    ) : (
                      <div className="space-y-6 max-w-lg">
                        <Table>
                          <TableBody>
                            <TableRow>
                              <TableCell>Net income (P&amp;L)</TableCell>
                              <TableCell className="text-right font-mono">
                                {cashFlow.netIncome.toFixed(2)}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>
                                Δ Accounts receivable (1200)
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                {(-cashFlow.deltaAccountsReceivable).toFixed(2)}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Δ Accounts payable (2000)</TableCell>
                              <TableCell className="text-right font-mono">
                                {cashFlow.deltaAccountsPayable.toFixed(2)}
                              </TableCell>
                            </TableRow>
                            <TableRow className="font-bold bg-muted/50">
                              <TableCell>
                                Operating cash flow (approx.)
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                {cashFlow.operatingCashFlow.toFixed(2)}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Investing (placeholder)</TableCell>
                              <TableCell className="text-right font-mono">
                                {cashFlow.investingCashFlow.toFixed(2)}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Financing (placeholder)</TableCell>
                              <TableCell className="text-right font-mono">
                                {cashFlow.financingCashFlow.toFixed(2)}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {cashFlow.methodologyNote}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </>
          )}
        </Tabs>
      ) : null}
    </div>
  );
}
