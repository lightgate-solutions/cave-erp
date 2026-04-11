"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";

type OverviewResponse = {
  operationsExpenses30d: number;
  glNetIncomeMtd: number;
  receivablesOutstanding: number;
  payablesOutstanding: number;
};

type ChartRow = {
  key: string;
  shortLabel: string;
  label: string;
  subtitle: string;
  /** Bar length (non-negative) */
  magnitude: number;
  /** Raw value for tooltip (e.g. signed net income) */
  value: number;
  fill: string;
};

const CHART_FILLS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
] as const;

function buildRows(data: OverviewResponse): ChartRow[] {
  const glRaw = data.glNetIncomeMtd;
  const glMag = Math.abs(glRaw);

  return [
    {
      key: "operations",
      shortLabel: "Finance",
      label: "Finance operations",
      subtitle: "Company & project expenses (30 days)",
      magnitude: data.operationsExpenses30d,
      value: data.operationsExpenses30d,
      fill: CHART_FILLS[0],
    },
    {
      key: "gl",
      shortLabel: "GL",
      label: "General ledger",
      subtitle: "Net income (month to date)",
      magnitude: glMag,
      value: glRaw,
      fill: CHART_FILLS[1],
    },
    {
      key: "receivables",
      shortLabel: "Receivables",
      label: "Receivables",
      subtitle: "Outstanding invoice balance",
      magnitude: data.receivablesOutstanding,
      value: data.receivablesOutstanding,
      fill: CHART_FILLS[2],
    },
    {
      key: "payables",
      shortLabel: "Payables",
      label: "Payables",
      subtitle: "Outstanding vendor bills",
      magnitude: data.payablesOutstanding,
      value: data.payablesOutstanding,
      fill: CHART_FILLS[3],
    },
  ];
}

function formatNgn(n: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(n);
}

export function FinanceSidebarOperationsChart({
  className,
}: {
  className?: string;
}) {
  const [rows, setRows] = useState<ChartRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/finance/sidebar-overview");
      if (!res.ok) throw new Error("Bad response");
      const data = (await res.json()) as OverviewResponse;
      if (typeof data.operationsExpenses30d !== "number") throw new Error();
      setRows(buildRows(data));
    } catch {
      setError(true);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const onRefresh = () => load();
    window.addEventListener("expenses:changed", onRefresh);
    return () => window.removeEventListener("expenses:changed", onRefresh);
  }, [load]);

  if (loading) {
    return (
      <div
        className={cn("w-full rounded-md border bg-muted/30 p-3", className)}
      >
        <div className="h-3 w-24 rounded bg-muted animate-pulse mb-3" />
        <div className="h-[180px] rounded bg-muted/50 animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={cn(
          "w-full rounded-md border border-dashed p-3 text-center text-xs text-muted-foreground",
          className,
        )}
      >
        Snapshot unavailable
      </div>
    );
  }

  const maxMag = Math.max(...rows.map((r) => r.magnitude), 0);

  if (maxMag === 0) {
    return (
      <div
        className={cn(
          "w-full rounded-md border bg-card px-3 pb-3 pt-3 md:px-4",
          className,
        )}
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
          Cross-module snapshot
        </p>
        <p className="text-sm text-muted-foreground leading-snug mb-2">
          Finance spend (30d), GL profit (MTD), receivables & payables
          outstanding
        </p>
        <p className="text-xs text-muted-foreground py-6 text-center">
          No amounts in this snapshot yet
        </p>
      </div>
    );
  }

  const chartData = rows.map((r) => ({
    ...r,
    barValue: r.magnitude,
  }));

  return (
    <div
      className={cn(
        "w-full rounded-md border bg-card px-3 pb-3 pt-3 md:px-4",
        className,
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
        Cross-module snapshot
      </p>
      <p className="text-sm text-muted-foreground leading-snug mb-2">
        Finance spend (30d), GL profit (MTD), receivables & payables outstanding
      </p>
      <div className="h-[220px] w-full min-h-[200px] [&_.recharts-cartesian-axis-tick-value]:fill-muted-foreground [&_.recharts-cartesian-axis-tick-value]:text-[11px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 0, right: 4, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={false}
              className="stroke-muted/40"
            />
            <XAxis
              type="number"
              domain={[0, maxMag]}
              tickFormatter={(v) =>
                v >= 1_000_000
                  ? `₦${(v / 1_000_000).toFixed(1)}M`
                  : v >= 1_000
                    ? `₦${(v / 1_000).toFixed(0)}k`
                    : `₦${v}`
              }
              tick={{ fontSize: 10 }}
            />
            <YAxis
              type="category"
              dataKey="shortLabel"
              width={92}
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const p = payload[0]?.payload as ChartRow | undefined;
                if (!p) return null;
                const isGl = p.key === "gl";
                return (
                  <div className="rounded-md border bg-popover px-2 py-1.5 text-xs shadow-md">
                    <p className="font-medium">{p.label}</p>
                    <p className="text-muted-foreground">{p.subtitle}</p>
                    <p
                      className={cn(
                        "mt-1 font-semibold tabular-nums",
                        isGl && p.value < 0 && "text-red-600 dark:text-red-400",
                        isGl &&
                          p.value > 0 &&
                          "text-green-600 dark:text-green-400",
                      )}
                    >
                      {formatNgn(isGl ? p.value : p.magnitude)}
                      {isGl && p.value < 0 ? " (loss)" : ""}
                      {isGl && p.value > 0 ? " (profit)" : ""}
                    </p>
                  </div>
                );
              }}
            />
            <Bar dataKey="barValue" radius={[0, 4, 4, 0]}>
              {chartData.map((entry) => (
                <Cell key={entry.key} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
