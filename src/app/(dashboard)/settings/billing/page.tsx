import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getInvoiceHistory, getSubscriptionDetails } from "@/actions/billing";
import { PlanCards } from "@/components/billing/PlanCards";

export default async function BillingPage() {
  const { subscription, error: subError } = await getSubscriptionDetails();
  const { invoices, error: invError } = await getInvoiceHistory();

  if (subError || invError) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Billing Information</h1>
        <p className="text-red-500">
          Error loading billing information: {subError || invError}
        </p>
      </div>
    );
  }

  const formatDate = (dateString?: string | Date | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold">Billing & Subscription</h1>

      {/* Subscription Details Card */}
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>
            Details about your current subscription plan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {subscription ? (
            <div className="space-y-2">
              <p>
                <strong>Plan:</strong> {subscription.plan.toUpperCase()}
              </p>
              <p>
                <strong>Status:</strong>{" "}
                {subscription.status.replace(/_/g, " ").toUpperCase()}
              </p>
              <p>
                <strong>Price per Member:</strong> ₦
                {parseFloat(subscription.pricePerMember).toLocaleString(
                  "en-NG",
                  { minimumFractionDigits: 2 },
                )}
              </p>
              <p>
                <strong>Current Period:</strong>{" "}
                {formatDate(subscription.currentPeriodStart)} -{" "}
                {formatDate(subscription.currentPeriodEnd)}
              </p>
              {subscription.cancelAtPeriodEnd && (
                <p className="text-red-500">
                  Your subscription will cancel at the end of the current
                  period.
                </p>
              )}
              <PlanCards currentPlanId={subscription.plan} />
            </div>
          ) : (
            <PlanCards currentPlanId="free" />
          )}
        </CardContent>
      </Card>

      {/* Invoice History Card */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice History</CardTitle>
          <CardDescription>
            A list of your past and pending invoices.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invoices && invoices.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice ID</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.id}</TableCell>
                    <TableCell>
                      {formatDate(invoice.billingPeriodStart)} -{" "}
                      {formatDate(invoice.billingPeriodEnd)}
                    </TableCell>
                    <TableCell>
                      ₦
                      {parseFloat(invoice.amount).toLocaleString("en-NG", {
                        minimumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell>{invoice.status.toUpperCase()}</TableCell>
                    <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p>No invoices found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
