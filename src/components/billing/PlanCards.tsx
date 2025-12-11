/** biome-ignore-all lint/suspicious/noArrayIndexKey: <> */
"use client";

import { useState, useTransition } from "react";
import { getAllPlans, isHigherTier, type PlanId } from "@/lib/plans";
import { createCheckoutSession } from "@/actions/billing";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function PlanCards({
  currentPlanId = "free",
}: {
  currentPlanId?: string;
}) {
  const plans = getAllPlans();
  const [selectedPlan, setSelectedPlan] = useState<{
    id: string;
    displayName: string;
    isUpgrade: boolean;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handlePlanChange = (planId: PlanId, displayName: string) => {
    const isUpgrade = isHigherTier(planId, currentPlanId as PlanId);
    setSelectedPlan({ id: planId, displayName, isUpgrade });
  };

  const confirmPlanChange = async () => {
    if (!selectedPlan) return;

    startTransition(async () => {
      try {
        const result = await createCheckoutSession(
          selectedPlan.id as "pro" | "proAI" | "premium" | "premiumAI",
        );

        if (result?.error) {
          toast.error("Failed to change plan", {
            description: result.error,
          });
        } else {
          toast.success(
            `${selectedPlan.isUpgrade ? "Upgrade" : "Downgrade"} initiated`,
            {
              description: `Redirecting you to complete the ${selectedPlan.displayName} plan setup...`,
            },
          );
        }
      } catch (error) {
        toast.error("Something went wrong", {
          description:
            error instanceof Error
              ? error.message
              : "An unexpected error occurred. Please try again.",
        });
      } finally {
        setSelectedPlan(null);
      }
    });
  };

  return (
    <>
      <div className="grid md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={`flex flex-col ${
              plan.id === currentPlanId ? "border-2 border-primary" : ""
            }`}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{plan.displayName}</CardTitle>
                {plan.ui.badge && (
                  <Badge variant="secondary" className="text-xs">
                    {plan.ui.badge}
                  </Badge>
                )}
              </div>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 flex flex-col h-full">
              <div>
                <p className="text-2xl font-bold">
                  {plan.pricing.displayPrice}
                  {plan.pricing.perMemberMonthly > 0 && (
                    <span className="text-sm font-normal">
                      {" "}
                      / member / month
                    </span>
                  )}
                </p>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5 flex-grow">
                {plan.features.map((feature, idx) => (
                  <li
                    key={idx}
                    className={
                      !feature.included ? "line-through opacity-50" : ""
                    }
                  >
                    {feature.name}
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => handlePlanChange(plan.id, plan.displayName)}
                disabled={
                  plan.id === currentPlanId ||
                  plan.ui.ctaDisabled ||
                  plan.id === "free" ||
                  isPending
                }
                className="w-full mt-auto"
              >
                {isPending && selectedPlan?.id === plan.id ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Processing...
                  </>
                ) : plan.id === currentPlanId ? (
                  "Current Plan"
                ) : isHigherTier(plan.id, currentPlanId as PlanId) ? (
                  `Upgrade to ${plan.displayName}`
                ) : (
                  `Downgrade to ${plan.displayName}`
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!selectedPlan} onOpenChange={() => setSelectedPlan(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Confirm {selectedPlan?.isUpgrade ? "Upgrade" : "Downgrade"}
            </DialogTitle>
            <DialogDescription>
              {selectedPlan?.isUpgrade ? (
                <>
                  You are about to upgrade to the{" "}
                  <strong>{selectedPlan.displayName}</strong> plan. You will be
                  redirected to complete the payment process.
                </>
              ) : (
                <>
                  You are about to downgrade to the{" "}
                  <strong>{selectedPlan?.displayName}</strong> plan. This change
                  will take effect immediately, and you may receive a prorated
                  credit.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelectedPlan(null)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button onClick={confirmPlanChange} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="animate-spin" />
                  Processing...
                </>
              ) : (
                "Confirm"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
