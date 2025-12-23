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
  const backgroundStyle = isEnterprise
    ? { background: "linear-gradient(to bottom right, #f8f8f8, #f0f0f0)" }
    : { backgroundColor: "#f8f8f8" };

  return (
    <div
      className={`group/plan relative flex h-full flex-col overflow-hidden transition-all duration-300 hover:scale-[1.02] rounded-xl border text-card-foreground shadow-sm hover:shadow-xl ${className} ${
        isRecommended
          ? "border-2 border-primary/30"
          : "border border-transparent hover:border-primary/30"
      }`}
      style={backgroundStyle}
    >
      {children}
    </div>
  );
}
