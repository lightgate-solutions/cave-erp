"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { BalanceCard } from "@/components/finance/balance-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowDownLeft,
  CreditCard,
  Plus,
  FileText,
  Receipt,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { DatePickerWithRange } from "@/components/finance/date-range-picker";

// Lazy load chart component to reduce initial bundle size (bundle-dynamic-imports)
const FinanceChart = dynamic(
  () =>
    import("@/components/finance/finance-chart").then((mod) => ({
      default: mod.FinanceChart,
    })),
  {
    loading: () => <div className="h-64 animate-pulse rounded bg-muted" />,
    ssr: false,
  },
);
const FinanceOverviewSnapshotChart = dynamic(
  () =>
    import("@/components/finance/finance-sidebar-operations-chart").then(
      (mod) => ({ default: mod.FinanceSidebarOperationsChart }),
    ),
  {
    loading: () => (
      <div className="h-[280px] w-full animate-pulse rounded-xl border bg-muted/30" />
    ),
    ssr: false,
  },
);
import type { DateRange } from "react-day-picker";
import { addDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { BalanceUpdateDialog } from "@/components/finance/balance-update-dialog";
import { ExpenseFormDialog } from "@/components/finance/expense-form-dialog";

function FinanceOverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 rounded bg-muted animate-pulse" />
          <div className="h-4 w-72 max-w-full rounded bg-muted animate-pulse" />
        </div>
        <div className="h-10 w-[300px] max-w-full rounded-md bg-muted animate-pulse" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((k) => (
          <Card key={k}>
            <CardHeader className="space-y-2">
              <div className="h-4 w-24 rounded bg-muted animate-pulse" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="h-8 w-32 rounded bg-muted animate-pulse" />
              <div className="h-9 w-full max-w-[140px] rounded-md bg-muted animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="h-[280px] w-full rounded-xl border bg-muted/20 animate-pulse" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4 h-64 rounded-lg bg-muted animate-pulse" />
        <Card className="col-span-3">
          <CardHeader>
            <div className="h-5 w-28 rounded bg-muted animate-pulse" />
          </CardHeader>
          <CardContent className="grid gap-4">
            {[1, 2, 3].map((k) => (
              <div
                key={k}
                className="h-16 w-full rounded-md border bg-muted/40 animate-pulse"
              />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function FinancePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState({
    totalExpenses: "0",
    activeLoans: 0,
    chartData: [],
  });
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (date?.from) params.append("from", date.from.toISOString());
      if (date?.to) params.append("to", date.to.toISOString());

      const res = await fetch(`/api/finance/stats?${params.toString()}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setStats({
        totalExpenses: data.totalExpenses || "0",
        activeLoans: data.activeLoans || 0,
        chartData: data.chartData || [],
      });
    } catch (error) {
      console.error("Error fetching finance stats:", error);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <FinanceOverviewSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Finance Overview
          </h2>
          <p className="text-muted-foreground">
            Manage your company finances, expenses, and payruns.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DatePickerWithRange date={date} setDate={setDate} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <BalanceCard />
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Expenses
            </CardTitle>
            <ArrowDownLeft className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 w-32 animate-pulse rounded bg-muted" />
            ) : (
              <div className="text-2xl font-bold">
                {formatCurrency(Number(stats.totalExpenses))}
              </div>
            )}
            <div className="flex flex-col items-start gap-2 justify-between mt-4">
              <p className="text-xs text-muted-foreground">
                {date?.from ? "In selected period" : "Lifetime expenses"}
              </p>
              <div className="flex gap-2">
                <ExpenseFormDialog
                  onCompleted={() => {
                    fetchStats();
                    window.dispatchEvent(new Event("expenses:changed"));
                  }}
                  trigger={
                    <Button size="sm" className="h-7 text-xs shadow-sm">
                      <Plus className="h-3 w-3 mr-1" />
                      Add Expense
                    </Button>
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Loans</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 w-16 animate-pulse rounded bg-muted" />
            ) : (
              <div className="text-2xl font-bold">{stats.activeLoans}</div>
            )}
            <p className="text-xs text-muted-foreground">
              {stats.activeLoans === 0
                ? "No active loans"
                : `${stats.activeLoans} active loan${stats.activeLoans === 1 ? "" : "s"}`}
            </p>
          </CardContent>
        </Card>
      </div>

      <FinanceOverviewSnapshotChart />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <FinanceChart data={stats.chartData} loading={loading} />

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <BalanceUpdateDialog
              onCompleted={() => {
                fetchStats();
                // Trigger balance refresh event for BalanceCard
                window.dispatchEvent(new Event("expenses:changed"));
              }}
              trigger={
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto py-4 px-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Plus className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex flex-col items-start text-left">
                      <span className="font-semibold">Add Funds</span>
                      <span className="text-xs text-muted-foreground">
                        Top up company balance
                      </span>
                    </div>
                  </div>
                </Button>
              }
            />

            <Button
              variant="outline"
              className="w-full justify-start h-auto py-4 px-4"
              onClick={() => router.push("/finance/expenses")}
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Receipt className="h-5 w-5 text-primary" />
                </div>
                <div className="flex flex-col items-start text-left">
                  <span className="font-semibold">Expenses</span>
                  <span className="text-xs text-muted-foreground">
                    Record and track expenses
                  </span>
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start h-auto py-4 px-4"
              onClick={() => router.push("/finance/payruns")}
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="flex flex-col items-start text-left">
                  <span className="font-semibold">Payruns</span>
                  <span className="text-xs text-muted-foreground">
                    Manage employee payments
                  </span>
                </div>
              </div>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
