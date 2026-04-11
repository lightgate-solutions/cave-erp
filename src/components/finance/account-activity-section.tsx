"use client";

import dynamic from "next/dynamic";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { AccountActivityCardProps } from "@/components/finance/account-activity-card";

const AccountActivityCard = dynamic(
  () =>
    import("@/components/finance/account-activity-card").then((mod) => ({
      default: mod.AccountActivityCard,
    })),
  {
    ssr: false,
    loading: () => (
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>Loading…</CardDescription>
        </CardHeader>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading…
        </CardContent>
      </Card>
    ),
  },
);

export function AccountActivitySection(props: AccountActivityCardProps) {
  return <AccountActivityCard {...props} />;
}
