"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";

interface CashFlowChartProps {
  data: {
    name: string;
    amount: number;
    fill: string;
  }[];
}

function formatYAxisTick(value: number, compact: boolean) {
  if (!Number.isFinite(value)) return "$0";
  if (compact) {
    if (Math.abs(value) >= 1_000_000)
      return `$${(value / 1_000_000).toFixed(1)}M`;
    if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(0)}k`;
  }
  return `$${value.toLocaleString()}`;
}

function truncateAxisLabel(label: string, compact: boolean) {
  if (!compact) return label;
  if (label.includes("Receivables")) return "Receivables";
  if (label.includes("Payables")) return "Payables";
  return label.length > 14 ? `${label.slice(0, 12)}…` : label;
}

export function CashFlowChart({ data }: CashFlowChartProps) {
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const apply = () => setCompact(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const height = compact ? 240 : 320;

  const chartData = data.map((d) => ({
    ...d,
    axisLabel: truncateAxisLabel(d.name, compact),
  }));

  return (
    <div className="w-full min-w-0 -mx-1 sm:mx-0">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={chartData}
          margin={{
            top: 8,
            right: compact ? 4 : 12,
            left: compact ? -8 : 0,
            bottom: compact ? 48 : 24,
          }}
        >
          <XAxis
            dataKey="axisLabel"
            stroke="hsl(var(--muted-foreground))"
            fontSize={compact ? 10 : 12}
            tickLine={false}
            axisLine={false}
            interval={0}
            tickMargin={8}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={compact ? 10 : 12}
            tickLine={false}
            axisLine={false}
            width={compact ? 44 : 56}
            tickFormatter={(v) => formatYAxisTick(Number(v), compact)}
          />
          <Tooltip
            cursor={{ fill: "transparent" }}
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid hsl(var(--border))",
              fontSize: compact ? 12 : 13,
              maxWidth: "min(90vw, 280px)",
            }}
            labelStyle={{ wordBreak: "break-word" }}
            formatter={(value: number) => [
              `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
              "Amount",
            ]}
            labelFormatter={(_, payload) =>
              (payload?.[0]?.payload as { name?: string })?.name ?? ""
            }
          />
          <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
            {data.map((entry) => (
              <Cell key={`${entry.name}-${entry.fill}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
