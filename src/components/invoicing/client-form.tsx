"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  createClient,
  updateClient,
  generateClientCode,
} from "@/actions/invoicing/clients";

const clientFormSchema = z.object({
  clientCode: z.string().min(1, "Client code is required"),
  name: z
    .string()
    .trim()
    .min(2, "Enter at least 2 characters")
    .max(200, "Max 200 characters"),
  email: z.email("Enter a valid email address"),
  phone: z
    .string()
    .max(32, "Max 32 characters")
    .refine(
      (v) => v.trim().length === 0 || v.trim().length >= 8,
      "If provided, use at least 8 characters",
    ),
  companyName: z.string().max(200, "Max 200 characters"),
  taxId: z.string().max(64, "Max 64 characters"),
  billingAddress: z.string().max(500, "Max 500 characters"),
  billingCity: z.string().max(120, "Max 120 characters"),
  billingState: z.string().max(120, "Max 120 characters"),
  billingPostalCode: z.string().max(32, "Max 32 characters"),
  billingCountry: z.string().max(120, "Max 120 characters"),
  shippingAddress: z.string().max(500, "Max 500 characters"),
  shippingCity: z.string().max(120, "Max 120 characters"),
  shippingState: z.string().max(120, "Max 120 characters"),
  shippingPostalCode: z.string().max(32, "Max 32 characters"),
  shippingCountry: z.string().max(120, "Max 120 characters"),
  website: z
    .string()
    .max(2048, "URL is too long")
    .superRefine((val, ctx) => {
      const v = val.trim();
      if (v.length === 0) return;
      try {
        // eslint-disable-next-line no-new
        new URL(v);
      } catch {
        ctx.addIssue({
          code: "custom",
          message:
            "Enter a valid URL (e.g. https://example.com) or leave blank",
        });
      }
    }),
  notes: z.string().max(5000, "Notes cannot exceed 5000 characters"),
  isActive: z.boolean().optional(),
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

function RequiredMark() {
  return (
    <span className="text-destructive" aria-hidden>
      {" "}
      *
    </span>
  );
}

function OptionalMark() {
  return <span className="text-muted-foreground font-normal"> (optional)</span>;
}

interface ClientFormProps {
  mode: "create" | "edit";
  initialData?: ClientFormValues & { id: number };
}

export function ClientForm({ mode, initialData }: ClientFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copyBillingToShipping, setCopyBillingToShipping] = useState(false);

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: initialData || {
      clientCode: "",
      name: "",
      email: "",
      phone: "",
      companyName: "",
      taxId: "",
      billingAddress: "",
      billingCity: "",
      billingState: "",
      billingPostalCode: "",
      billingCountry: "",
      shippingAddress: "",
      shippingCity: "",
      shippingState: "",
      shippingPostalCode: "",
      shippingCountry: "",
      website: "",
      notes: "",
      isActive: true,
    },
  });

  // Generate client code on mount for new clients
  useEffect(() => {
    if (mode === "create" && !form.getValues("clientCode")) {
      generateClientCode().then((code) => {
        if (code) {
          form.setValue("clientCode", code);
        }
      });
    }
  }, [mode, form]);

  // Copy billing to shipping when checkbox is checked
  useEffect(() => {
    if (copyBillingToShipping) {
      const billing = form.getValues();
      form.setValue("shippingAddress", billing.billingAddress);
      form.setValue("shippingCity", billing.billingCity);
      form.setValue("shippingState", billing.billingState);
      form.setValue("shippingPostalCode", billing.billingPostalCode);
      form.setValue("shippingCountry", billing.billingCountry);
    }
  }, [copyBillingToShipping, form]);

  async function onSubmit(data: ClientFormValues) {
    setIsSubmitting(true);

    try {
      if (mode === "create") {
        const result = await createClient(data);

        if (result.success) {
          toast.success("Client created successfully");
          router.replace(`/invoicing/clients?_refresh=${Date.now()}`);
        } else {
          toast.error(result.error?.reason || "Failed to create client");
        }
      } else if (initialData?.id) {
        const { clientCode: _clientCode, ...updateData } = data;
        const result = await updateClient(initialData.id, updateData);

        if (result.success) {
          toast.success("Client updated successfully");
          router.replace(
            `/invoicing/clients/${initialData.id}?_refresh=${Date.now()}`,
          );
        } else {
          toast.error(result.error?.reason || "Failed to update client");
        }
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error("Error submitting client form:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Client contact and identification details. Fields marked with
              <span className="text-destructive"> *</span> are required; others
              are optional.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="clientCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Client Code
                    <OptionalMark />
                  </FormLabel>
                  <FormControl>
                    <Input {...field} disabled placeholder="CLI-2026-0001" />
                  </FormControl>
                  <FormDescription>
                    Auto-generated unique identifier (read-only; you do not need
                    to edit this)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Name
                      <RequiredMark />
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="John Doe" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Email
                      <RequiredMark />
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="john@example.com"
                        autoComplete="email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Phone
                      <OptionalMark />
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                        autoComplete="tel"
                      />
                    </FormControl>
                    <FormDescription>
                      If you enter a number, use at least 8 characters.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Company Name
                      <OptionalMark />
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Acme Corporation" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="taxId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Tax ID
                      <OptionalMark />
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="12-3456789" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Website
                      <OptionalMark />
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="url"
                        placeholder="https://example.com"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Billing Address */}
        <Card>
          <CardHeader>
            <CardTitle>Billing Address</CardTitle>
            <CardDescription>
              All billing address fields are optional. Include what you want on
              invoices and statements.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="billingAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Street Address
                    <OptionalMark />
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="123 Main St" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="billingCity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      City
                      <OptionalMark />
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="San Francisco" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="billingState"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      State/Province
                      <OptionalMark />
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="CA" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="billingPostalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Postal Code
                      <OptionalMark />
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="94102" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="billingCountry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Country
                      <OptionalMark />
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="United States" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Shipping Address */}
        <Card>
          <CardHeader>
            <CardTitle>Shipping Address</CardTitle>
            <CardDescription className="space-y-2">
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="copyBilling"
                  checked={copyBillingToShipping}
                  onCheckedChange={(checked) =>
                    setCopyBillingToShipping(checked as boolean)
                  }
                />
                <label
                  htmlFor="copyBilling"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Same as billing address
                </label>
              </div>
              <p className="text-muted-foreground text-sm">
                Shipping fields are optional unless you need a different ship-to
                address.
              </p>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="shippingAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Street Address
                    <OptionalMark />
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="123 Main St"
                      disabled={copyBillingToShipping}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="shippingCity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      City
                      <OptionalMark />
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="San Francisco"
                        disabled={copyBillingToShipping}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="shippingState"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      State/Province
                      <OptionalMark />
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="CA"
                        disabled={copyBillingToShipping}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="shippingPostalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Postal Code
                      <OptionalMark />
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="94102"
                        disabled={copyBillingToShipping}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="shippingCountry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Country
                      <OptionalMark />
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="United States"
                        disabled={copyBillingToShipping}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
            <CardDescription>
              Notes are optional and only visible inside your organization.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Notes
                    <OptionalMark />
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Any additional notes about this client..."
                      rows={4}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {mode === "edit" && (
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active Status</FormLabel>
                      <FormDescription>
                        Inactive clients won't appear in new invoice forms
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "create" ? "Create Client" : "Update Client"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
