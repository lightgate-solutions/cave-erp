/** biome-ignore-all lint/suspicious/noExplicitAny: <> */
/** biome-ignore-all lint/complexity/noUselessLoneBlockStatements: <> */
/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <> */

"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function BillingsTab({
  user,
}: {
  user: { id: string; email: string; name: string; emailVerified: boolean };
}) {
  console.log(user);
  const [role, _setRole] = useState<string>("");
  const [_roleLoading, _setRoleLoading] = useState(true);
  const [_roleError, _setRoleError] = useState<string | null>(null);
  const pathname = usePathname();
  const [activePlan, _setActivePlan] = useState<string>("standard");

  return (
    <div>
      {role === "owner" ? (
        <div className="space-y-6">
          {pathname !== "/organizations/create" && (
            <Card>
              <CardHeader>
                <CardTitle>Billing</CardTitle>
                <CardDescription>
                  Manage your billing and subscription information.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button>Open Customer Portal</Button>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader>
              <CardTitle>Plans</CardTitle>
              <CardDescription>
                Choose a plan that fits your usage and goals.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-4">
              {[
                { name: "Standard", price: "Free", slug: "standard" },
                { name: "Pro", price: "$3.25 / month", slug: "pro" },
                { name: "Premium", price: "$5.00 / month", slug: "premium" },
              ].map((plan) => (
                <Card
                  key={plan.slug}
                  className={`border ${
                    activePlan === plan.slug ? "border-primary" : ""
                  }`}
                >
                  <CardHeader>
                    <CardTitle>{plan.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {plan.price}
                    </p>
                    {activePlan === plan.slug && activePlan !== "standard" && (
                      <div>{plan.slug}</div>
                    )}

                    {activePlan === "standard" && <div>{plan.slug}</div>}
                    {activePlan !== plan.slug && activePlan !== "standard" && (
                      <div className="text-muted-foreground text-sm">
                        change plan in customer portal
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Billing</CardTitle>
            <CardDescription>
              Manage your billing and subscription information.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Create an organization to manage billing
            </CardDescription>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

{
  /**
function BillingSkeleton() {
  return (
    <div className="grid p-2 md:grid-cols-3 gap-4">
      <div className="flex flex-col space-y-3">
        <Skeleton className="h-[125px] w-[250px] rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>

      <div className="flex flex-col space-y-3">
        <Skeleton className="h-[125px] w-[250px] rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>

      <div className="flex flex-col space-y-3">
        <Skeleton className="h-[125px] w-[250px] rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
    </div>
  );
}

function _FullBillingSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-8 w-32" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-80" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-40" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-8 w-24" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-72" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BillingSkeleton />
        </CardContent>
      </Card>
    </div>
  );
}
**/
}
