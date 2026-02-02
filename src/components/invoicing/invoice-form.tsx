/** biome-ignore-all lint/suspicious/noExplicitAny: <> */

"use client";

import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Calendar } from "lucide-react";
import { format } from "date-fns";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import {
  createInvoice,
  updateInvoice,
  generateInvoiceNumber,
  sendInvoice,
} from "@/actions/invoicing/invoices";
import { getAllClients } from "@/actions/invoicing/clients";
import { getAllOrganizationCurrencies } from "@/actions/invoicing/currencies";
import { getBankAccounts } from "@/actions/invoicing/bank-accounts";
import { calculateInvoiceAmounts } from "@/lib/invoicing-utils";

const lineItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.number().min(0.01, "Quantity must be greater than 0"),
  unitPrice: z.number().min(0, "Unit price must be non-negative"),
  amount: z.number(),
});

const taxSchema = z.object({
  taxName: z.string().min(1, "Tax Name is required"),
  taxPercentage: z
    .number()
    .min(0)
    .max(100, "Percentage must be between 0 and 100"),
});

const invoiceFormSchema = z.object({
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  clientId: z.number().min(1, "Client is required"),
  currencyId: z.number().min(1, "Currency is required"),
  bankAccountId: z.number().optional(),
  invoiceDate: z.date(),
  dueDate: z.date(),
  lineItems: z
    .array(lineItemSchema)
    .min(1, "At least one line item is required"),
  taxes: z.array(taxSchema).optional(),
  notes: z.string().optional(),
  termsAndConditions: z.string().optional(),
  footerNote: z.string().optional(),
  template: z.enum([
    "Modern",
    "Classic",
    "Minimal",
    "Detailed",
    "Professional",
  ]),
});

type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

interface InvoiceFormProps {
  mode: "create" | "edit";
  initialData?: Partial<InvoiceFormValues> & { id?: number };
}

export function InvoiceForm({ mode, initialData }: InvoiceFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clients, setClients] = useState<
    Awaited<ReturnType<typeof getAllClients>>
  >([]);
  const [currencies, setCurrencies] = useState<
    Awaited<ReturnType<typeof getAllOrganizationCurrencies>>
  >([]);
  const [bankAccounts, setBankAccounts] = useState<
    Awaited<ReturnType<typeof getBankAccounts>>
  >([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: initialData || {
      invoiceNumber: "",
      clientId: 0,
      currencyId: 0,
      bankAccountId: 0,
      invoiceDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      lineItems: [{ description: "", quantity: 1, unitPrice: 0, amount: 0 }],
      taxes: [],
      notes: "",
      termsAndConditions: "",
      footerNote: "",
      template: "Modern",
    },
  });

  const {
    fields: lineItemFields,
    append: appendLineItem,
    remove: removeLineItem,
  } = useFieldArray({
    control: form.control,
    name: "lineItems",
  });

  const {
    fields: taxFields,
    append: appendTax,
    remove: removeTax,
  } = useFieldArray({
    control: form.control,
    name: "taxes",
  });

  // Load clients, currencies, and bank accounts
  useEffect(() => {
    async function loadData() {
      setIsLoadingData(true);
      try {
        const [clientsData, currenciesData, bankAccountsData] =
          await Promise.all([
            getAllClients({ isActive: true }),
            getAllOrganizationCurrencies(),
            getBankAccounts(),
          ]);

        setClients(clientsData);
        setCurrencies(currenciesData);
        setBankAccounts(bankAccountsData);

        // Set default currency if available and not already set
        if (currenciesData.length > 0 && !form.getValues("currencyId")) {
          const defaultCurrency =
            currenciesData.find((c) => c.isDefault) || currenciesData[0];
          form.setValue("currencyId", defaultCurrency.id);
        }

        // Set default bank account if available and not already set
        // Note: Logic to match bank account currency with invoice currency could be added here
        if (bankAccountsData.length > 0 && !form.getValues("bankAccountId")) {
          const defaultAccount =
            bankAccountsData.find((a) => a.isDefault) || bankAccountsData[0];
          form.setValue("bankAccountId", defaultAccount.id);
        }
      } catch (error) {
        toast.error("Failed to load form data");
        console.error(error);
      } finally {
        setIsLoadingData(false);
      }
    }

    loadData();
  }, [form]);

  // Generate invoice number on mount for new invoices
  useEffect(() => {
    if (mode === "create" && !form.getValues("invoiceNumber")) {
      generateInvoiceNumber().then((number) => {
        if (number) {
          form.setValue("invoiceNumber", number);
        }
      });
    }
  }, [mode, form]);

  // Calculate amounts when line items changes
  useEffect(() => {
    const subscription = form.watch((_value: any, { name }) => {
      // Avoid infinite loop by ignoring changes to the "amount" field itself
      if (name?.endsWith(".amount")) {
        return;
      }

      if (name?.startsWith("lineItems")) {
        const lineItems = form.getValues("lineItems") || [];

        // Calculate each line item amount
        lineItems.forEach((item, index) => {
          if (!item) return;
          const amount = (item.quantity || 0) * (item.unitPrice || 0);
          const currentAmount = form.getValues(`lineItems.${index}.amount`);

          // Only update if value has changed to avoid infinite loops
          if (currentAmount !== Number(amount.toFixed(2))) {
            form.setValue(
              `lineItems.${index}.amount`,
              Number(amount.toFixed(2)),
            );
          }
        });
      }
    });

    return () => subscription.unsubscribe();
  }, [form]);

  // Calculate subtotal, tax, and total for display
  const watchedLineItems = form.watch("lineItems") || [];
  const watchedTaxes = form.watch("taxes") || [];

  // Filter out any undefined items to match LineItem[]
  const validLineItems = watchedLineItems.filter(
    (item): item is z.infer<typeof lineItemSchema> => !!item,
  );

  const validTaxes = watchedTaxes.filter(
    (t): t is z.infer<typeof taxSchema> => !!t,
  );

  const { subtotal, taxAmount, total } = calculateInvoiceAmounts(
    validLineItems,
    validTaxes,
  );

  async function onSubmit(data: InvoiceFormValues, action: "draft" | "send") {
    setIsSubmitting(true);
    let invoiceId: number | undefined = initialData?.id;

    try {
      if (mode === "create") {
        const result = await createInvoice({
          ...data,
          invoiceDate: format(data.invoiceDate, "yyyy-MM-dd"),
          dueDate: format(data.dueDate, "yyyy-MM-dd"),
        });

        if (result.success) {
          invoiceId = result.success.data.id;
          if (action === "draft") {
            toast.success("Invoice created successfully");
            router.push(`/invoicing/invoices/${invoiceId}`);
            router.refresh();
          }
        } else {
          toast.error(result.error?.reason || "Failed to create invoice");
          setIsSubmitting(false);
          return;
        }
      } else if (invoiceId) {
        const result = await updateInvoice(invoiceId, {
          ...data,
          invoiceDate: format(data.invoiceDate, "yyyy-MM-dd"),
          dueDate: format(data.dueDate, "yyyy-MM-dd"),
        });

        if (result.success) {
          if (action === "draft") {
            toast.success("Invoice updated successfully");
            router.push(`/invoicing/invoices/${invoiceId}`);
            router.refresh();
          }
        } else {
          toast.error(result.error?.reason || "Failed to update invoice");
          setIsSubmitting(false);
          return;
        }
      }

      // If action is send, call sendInvoice
      if (action === "send" && invoiceId) {
        const sendResult = await sendInvoice(invoiceId);
        if (sendResult.success) {
          toast.success("Invoice sent successfully");
          router.push(`/invoicing/invoices/${invoiceId}`);
          router.refresh();
        } else {
          toast.error(sendResult.error?.reason || "Failed to send invoice");
        }
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error("Error submitting invoice form:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
        {/* Invoice Details */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
            <CardDescription>Basic invoice information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="invoiceNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice Number</FormLabel>
                    <FormControl>
                      <Input {...field} disabled placeholder="LIG-2026-0001" />
                    </FormControl>
                    <FormDescription>Auto-generated</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="template"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PDF Template</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select template" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Modern">Modern</SelectItem>
                        <SelectItem value="Classic">Classic</SelectItem>
                        <SelectItem value="Minimal">Minimal</SelectItem>
                        <SelectItem value="Detailed">Detailed</SelectItem>
                        <SelectItem value="Professional">
                          Professional
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client *</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(Number(value))}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select client" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem
                            key={client.id}
                            value={client.id.toString()}
                          >
                            {client.name}{" "}
                            {client.companyName && `(${client.companyName})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currencyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency *</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(Number(value))}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {currencies.map((currency) => (
                          <SelectItem
                            key={currency.id}
                            value={currency.id.toString()}
                          >
                            {currency.currencyCode} ({currency.currencySymbol})
                            - {currency.currencyName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bankAccountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Crediting Account</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(Number(value))}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select bank account" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {bankAccounts.map((account) => (
                          <SelectItem
                            key={account.id}
                            value={account.id.toString()}
                          >
                            {account.bankName} - {account.accountName} (
                            {account.currency})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Account to be displayed on invoice
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="invoiceDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Invoice Date *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground",
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <Calendar className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Due Date *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground",
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <Calendar className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date("1900-01-01")}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Line Items */}
        <Card>
          <CardHeader>
            <CardTitle>Line Items</CardTitle>
            <CardDescription>Products or services to invoice</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              {lineItemFields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid grid-cols-12 gap-4 items-start border-b pb-4"
                >
                  <div className="col-span-12 md:col-span-5">
                    <FormField
                      control={form.control}
                      name={`lineItems.${index}.description`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Item description" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="col-span-4 md:col-span-2">
                    <FormField
                      control={form.control}
                      name={`lineItems.${index}.quantity`}
                      render={({ field }) => {
                        const num =
                          typeof field.value === "number" &&
                          !Number.isNaN(field.value)
                            ? field.value
                            : "";
                        return (
                          <FormItem>
                            <FormLabel>Qty</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                value={num}
                                onChange={(e) => {
                                  const v = Number.parseFloat(e.target.value);
                                  field.onChange(Number.isNaN(v) ? 0 : v);
                                }}
                                onBlur={field.onBlur}
                                name={field.name}
                                ref={field.ref}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                  </div>

                  <div className="col-span-4 md:col-span-2">
                    <FormField
                      control={form.control}
                      name={`lineItems.${index}.unitPrice`}
                      render={({ field }) => {
                        const num =
                          typeof field.value === "number" &&
                          !Number.isNaN(field.value)
                            ? field.value
                            : "";
                        return (
                          <FormItem>
                            <FormLabel>Price</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                value={num}
                                onChange={(e) => {
                                  const v = Number.parseFloat(e.target.value);
                                  field.onChange(Number.isNaN(v) ? 0 : v);
                                }}
                                onBlur={field.onBlur}
                                name={field.name}
                                ref={field.ref}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                  </div>

                  <div className="col-span-3 md:col-span-2">
                    <FormField
                      control={form.control}
                      name={`lineItems.${index}.amount`}
                      render={({ field }) => {
                        const num =
                          typeof field.value === "number" &&
                          !Number.isNaN(field.value)
                            ? field.value
                            : "";
                        return (
                          <FormItem>
                            <FormLabel>Amount</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                value={num}
                                disabled
                                readOnly
                                name={field.name}
                                ref={field.ref}
                                onBlur={field.onBlur}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                  </div>

                  <div className="col-span-1 flex items-end pb-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLineItem(index)}
                      disabled={lineItemFields.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                appendLineItem({
                  description: "",
                  quantity: 1,
                  unitPrice: 0,
                  amount: 0,
                })
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Line Item
            </Button>

            {/* Totals */}
            <div className="space-y-4 border-t pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-medium">{subtotal.toFixed(2)}</span>
              </div>

              {/* Taxes Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Taxes</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => appendTax({ taxName: "", taxPercentage: 0 })}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Tax
                  </Button>
                </div>

                {taxFields.map((field, index) => (
                  <div
                    key={field.id}
                    className="grid grid-cols-12 gap-2 items-start"
                  >
                    <div className="col-span-6">
                      <FormField
                        control={form.control}
                        name={`taxes.${index}.taxName`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Tax Name (e.g. VAT)"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="col-span-4">
                      <FormField
                        control={form.control}
                        name={`taxes.${index}.taxPercentage`}
                        render={({ field }) => {
                          const num =
                            typeof field.value === "number" &&
                            !Number.isNaN(field.value)
                              ? field.value
                              : "";
                          return (
                            <FormItem>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="%"
                                  step="0.01"
                                  value={num}
                                  onChange={(e) => {
                                    const v = Number.parseFloat(e.target.value);
                                    field.onChange(Number.isNaN(v) ? 0 : v);
                                  }}
                                  onBlur={field.onBlur}
                                  name={field.name}
                                  ref={field.ref}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />
                    </div>
                    <div className="col-span-2 flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeTax(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Tax:</span>
                <span className="font-medium">{taxAmount.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total:</span>
                <span>{total.toFixed(2)}</span>
              </div>
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
                      placeholder="Internal notes (not visible to client)"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="termsAndConditions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Terms and Conditions</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Payment terms, conditions, etc."
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="footerNote"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Footer Note</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Thank you message or additional info"
                      rows={2}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
          <Button
            type="button"
            variant="secondary"
            disabled={isSubmitting}
            onClick={form.handleSubmit((data) => onSubmit(data, "draft"))}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save as Draft
          </Button>
          <Button
            type="button"
            disabled={isSubmitting}
            onClick={form.handleSubmit((data) => onSubmit(data, "send"))}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send Invoice
          </Button>
        </div>
      </form>
    </Form>
  );
}
