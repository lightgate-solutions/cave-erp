import type { ReactNode } from "react";

interface PricingCardProps {
  children: ReactNode;
  isRecommended?: boolean;
  isEnterprise?: boolean;
  className?: string;
}

export function PricingCard({
  children,
  isRecommended = false,
  isEnterprise = false,
  className = "",
}: PricingCardProps) {
  return (
    <div
      className={`group/plan relative flex h-full flex-col overflow-hidden transition-all duration-300 hover:scale-[1.02] rounded-xl border border-border bg-card text-card-foreground shadow-sm hover:shadow-xl ${className} ${
        isRecommended
          ? "border-2 border-primary/30"
          : "border-transparent hover:border-primary/30"
      } ${
        isEnterprise ? "bg-gradient-to-br from-card to-muted/50" : "bg-card"
      }`}
    >
      {children}
    </div>
  );
}
