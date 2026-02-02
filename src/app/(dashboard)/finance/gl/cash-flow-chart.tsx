"use client";

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

export function CashFlowChart({ data }: CashFlowChartProps) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <XAxis
          dataKey="name"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${value}`}
        />
        <Tooltip
          cursor={{ fill: "transparent" }}
          contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
          formatter={(value: number) => [
            `$${value.toLocaleString()}`,
            "Amount",
          ]}
        />
        <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
          {data.map((entry) => (
            <Cell key={`${entry.name}-${entry.fill}`} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
