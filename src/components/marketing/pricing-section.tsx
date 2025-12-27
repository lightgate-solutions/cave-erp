"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { PricingCard } from "./pricing-card";
import {
  CurrencySelector,
  type Currency,
  CURRENCIES,
} from "./currency-selector";
import { convertPrice, parseNGNPrice } from "@/lib/currency-utils";

interface Plan {
  name: string;
  nameSubtext?: string;
  description?: string;
  price: string | null;
  buttonText: string;
  buttonHref?: string;
  features: string[];
  recommended: boolean;
  isEnterprise?: boolean;
}

interface PricingSectionProps {
  plans: Plan[];
}

export function PricingSection({ plans }: PricingSectionProps) {
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(
    CURRENCIES[0],
  );

  useEffect(() => {
    // Load saved currency preference
    const savedCurrency = localStorage.getItem("preferred-currency");
    if (savedCurrency) {
      const currency = CURRENCIES.find((c) => c.code === savedCurrency);
      if (currency) {
        setSelectedCurrency(currency);
      }
    }
  }, []);

  const formatPrice = (price: string | null): string => {
    if (!price) return "";

    if (price === "₦0") {
      return `${selectedCurrency.symbol}0`;
    }

    const ngnPrice = parseNGNPrice(price);
    return convertPrice(ngnPrice, selectedCurrency);
  };

  return (
    <section
      id="pricing"
      className="border-y border-border bg-background py-20 md:py-32"
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              Choose Your Path to Organizational Excellence
            </h2>
            <p className="text-lg text-muted-foreground">
              From startup agility to enterprise power—select the perfect CAVE
              plan that scales with your ambition and transforms your operations
            </p>
            {/* Currency Selector */}
            <div className="mt-8 flex justify-center">
              <CurrencySelector onCurrencyChange={setSelectedCurrency} />
            </div>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => {
              const pricingCardContent = (
                <PricingCard
                  key={plan.name}
                  isRecommended={plan.recommended}
                  isEnterprise={plan.isEnterprise}
                >
                  <div className="flex flex-col h-full p-8">
                    {/* Header Section */}
                    <div className="mb-6">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-2xl font-bold tracking-tight">
                          {plan.name}
                        </h3>
                        {plan.recommended && (
                          <span className="text-lg font-semibold text-orange-600">
                            Recommended
                          </span>
                        )}
                      </div>
                      {plan.nameSubtext && (
                        <p className="mt-2 text-base font-medium text-muted-foreground">
                          {plan.nameSubtext}
                        </p>
                      )}
                    </div>

                    {/* Description */}
                    {plan.description && (
                      <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
                        {plan.description}
                      </p>
                    )}

                    {/* Price Section */}
                    {plan.price && (
                      <div className="mb-6 pb-6 border-b">
                        <div className="flex items-baseline gap-2">
                          <span className="text-4xl font-bold tracking-tight">
                            {formatPrice(plan.price)}
                          </span>
                          <span className="text-base text-muted-foreground font-medium">
                            / user / month
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Features List */}
                    <ul className="mb-8 flex-1 space-y-3.5">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3">
                          <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                          <span className="text-sm leading-relaxed text-foreground">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA Button */}
                    <div className="mt-auto pt-4">
                      {plan.isEnterprise ? (
                        <Button
                          size="lg"
                          className="w-full text-base font-semibold h-12"
                          variant="outline"
                          asChild
                        >
                          <Link href={plan.buttonHref || "/help"}>
                            {plan.buttonText}
                          </Link>
                        </Button>
                      ) : (
                        <Button
                          size="lg"
                          className={`w-full text-base font-semibold h-12 transition-all ${
                            plan.recommended
                              ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl"
                              : "hover:bg-primary hover:text-primary-foreground"
                          }`}
                          variant={plan.recommended ? "default" : "outline"}
                        >
                          {plan.buttonText}
                        </Button>
                      )}
                    </div>
                  </div>
                </PricingCard>
              );

              return plan.isEnterprise ? (
                <div key={plan.name} className="group">
                  {pricingCardContent}
                </div>
              ) : (
                <Link key={plan.name} href="/auth/register" className="group">
                  {pricingCardContent}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
