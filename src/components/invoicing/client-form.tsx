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
  name: z.string().min(1, "Name is required"),
  email: z.email("Invalid email address"),
  phone: z.string().optional(),
  companyName: z.string().optional(),
  taxId: z.string().optional(),
  billingAddress: z.string().optional(),
  billingCity: z.string().optional(),
  billingState: z.string().optional(),
  billingPostalCode: z.string().optional(),
  billingCountry: z.string().optional(),
  shippingAddress: z.string().optional(),
  shippingCity: z.string().optional(),
  shippingState: z.string().optional(),
  shippingPostalCode: z.string().optional(),
  shippingCountry: z.string().optional(),
  website: z.url("Invalid URL").optional().or(z.literal("")),
  notes: z.string().optional(),
  isActive: z.boolean().optional(),
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

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
          router.push("/invoicing/clients");
          router.refresh();
        } else {
          toast.error(result.error?.reason || "Failed to create client");
        }
      } else if (initialData?.id) {
        const { _clientCode, ...updateData } = data;
        const result = await updateClient(initialData.id, updateData);

        if (result.success) {
          toast.success("Client updated successfully");
          router.push(`/invoicing/clients/${initialData.id}`);
          router.refresh();
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
              Client contact and identification details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="clientCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Code</FormLabel>
                  <FormControl>
                    <Input {...field} disabled placeholder="CLI-2026-0001" />
                  </FormControl>
                  <FormDescription>
                    Auto-generated unique identifier
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
                    <FormLabel>Name *</FormLabel>
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
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="john@example.com"
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
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="+1 (555) 123-4567" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
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
                    <FormLabel>Tax ID</FormLabel>
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
                    <FormLabel>Website</FormLabel>
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
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="billingAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Street Address</FormLabel>
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
                    <FormLabel>City</FormLabel>
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
                    <FormLabel>State/Province</FormLabel>
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
                    <FormLabel>Postal Code</FormLabel>
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
                    <FormLabel>Country</FormLabel>
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
            <CardDescription>
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
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="shippingAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Street Address</FormLabel>
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
                    <FormLabel>City</FormLabel>
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
                    <FormLabel>State/Province</FormLabel>
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
                    <FormLabel>Postal Code</FormLabel>
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
                    <FormLabel>Country</FormLabel>
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
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
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
