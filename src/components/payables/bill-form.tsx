/** biome-ignore-all lint/suspicious/noExplicitAny: <> */
/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <> */

"use client";

import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Calendar, AlertTriangle } from "lucide-react";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

import {
  createBill,
  updateBill,
  generateBillNumber,
  checkForDuplicateBill,
} from "@/actions/payables/bills";
import { getAllVendors } from "@/actions/payables/vendors";
import { getAllOrganizationCurrencies } from "@/actions/invoicing/currencies";
import {
  getAllPurchaseOrders,
  getPurchaseOrder,
} from "@/actions/payables/purchase-orders";
import { calculateBillAmounts } from "@/lib/payables-utils";

const lineItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.number().min(0.01, "Quantity must be greater than 0"),
  unitPrice: z.number().min(0, "Unit price must be non-negative"),
  amount: z.number(),
  sortOrder: z.number().optional(),
  poLineItemId: z.number().optional(),
  poUnitPrice: z.number().optional(),
  poAmount: z.number().optional(),
});

const taxSchema = z.object({
  taxType: z.enum(["VAT", "WHT", "Sales Tax", "GST", "Custom"] as const),
  taxName: z.string().min(1, "Tax name is required"),
  taxPercentage: z
    .number()
    .min(0)
    .max(100, "Percentage must be between 0 and 100"),
  taxAmount: z.number().optional(),
  isWithholdingTax: z.boolean().optional(),
  whtCertificateNumber: z.string().optional(),
});

const billFormSchema = z.object({
  billNumber: z.string().min(1, "Bill number is required"),
  vendorInvoiceNumber: z.string().min(1, "Vendor invoice number is required"),
  vendorId: z.number().min(1, "Vendor is required"),
  poId: z.number().optional(),
  currencyId: z.number().min(1, "Currency is required"),
  billDate: z.date(),
  dueDate: z.date(),
  receivedDate: z.date(),
  lineItems: z
    .array(lineItemSchema)
    .min(1, "At least one line item is required"),
  taxes: z.array(taxSchema).optional(),
  notes: z.string().optional(),
  paymentTerms: z.string().optional(),
  isRecurring: z.boolean().optional(),
  recurringFrequency: z.string().optional(),
  recurringEndDate: z.date().optional(),
});

type BillFormValues = z.infer<typeof billFormSchema>;

interface BillFormProps {
  mode: "create" | "edit";
  billId?: number;
  initialData?: Partial<BillFormValues>;
  initialPoId?: number;
}

export function BillForm({
  mode,
  billId,
  initialData,
  initialPoId,
}: BillFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vendors, setVendors] = useState<any[]>([]);
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [duplicateCheck, setDuplicateCheck] = useState<any>(null);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);
  const [_isLoadingPO, setIsLoadingPO] = useState(false);
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);

  const form = useForm<BillFormValues>({
    resolver: zodResolver(billFormSchema),
    defaultValues: initialData || {
      billNumber: "",
      vendorInvoiceNumber: "",
      vendorId: 0,
      poId: initialPoId,
      currencyId: 0,
      billDate: new Date(),
      dueDate: new Date(),
      receivedDate: new Date(),
      lineItems: [
        {
          description: "",
          quantity: 1,
          unitPrice: 0,
          amount: 0,
          sortOrder: 0,
        },
      ],
      taxes: [],
      notes: "",
      paymentTerms: "",
      isRecurring: false,
      recurringFrequency: "",
      recurringEndDate: undefined,
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

  // Load data
  useEffect(() => {
    async function loadData() {
      try {
        const [vendorsData, currenciesData, posData, billNumber] =
          await Promise.all([
            getAllVendors(),
            getAllOrganizationCurrencies(),
            getAllPurchaseOrders({ status: "Approved" }),
            mode === "create" ? generateBillNumber() : Promise.resolve(null),
          ]);

        setVendors(vendorsData as any);
        setCurrencies(currenciesData as any);
        setPurchaseOrders(posData as any);

        if (mode === "create" && billNumber) {
          form.setValue("billNumber", billNumber);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Failed to load form data");
      } finally {
        setIsLoadingData(false);
      }
    }

    loadData();
  }, [mode, form]);

  // Auto-calculate line item amounts
  const watchedLineItems = form.watch("lineItems");
  const watchedTaxes = form.watch("taxes");

  useEffect(() => {
    watchedLineItems.forEach((item, index) => {
      const amount = item.quantity * item.unitPrice;
      if (item.amount !== amount) {
        form.setValue(`lineItems.${index}.amount`, amount, {
          shouldValidate: false,
        });
      }
    });
  }, [watchedLineItems, form]);

  // Auto-calculate tax amounts
  useEffect(() => {
    const subtotal = watchedLineItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );

    watchedTaxes?.forEach((tax, index) => {
      const calculatedAmount = (subtotal * tax.taxPercentage) / 100;
      if (tax.taxAmount !== calculatedAmount) {
        form.setValue(`taxes.${index}.taxAmount`, calculatedAmount, {
          shouldValidate: false,
        });
      }
    });
  }, [watchedLineItems, watchedTaxes, form]);

  // Handle PO selection - auto-populate line items (only when user changes PO, not on initial load)
  const watchedPoId = form.watch("poId");

  useEffect(() => {
    // Mark initial data as loaded after first render
    if (mode === "edit" && initialData && !hasLoadedInitialData) {
      setHasLoadedInitialData(true);
      return;
    }

    async function loadPOLineItems() {
      if (!watchedPoId) {
        return;
      }

      // Don't auto-load if we're in edit mode and this is the initial PO
      if (
        mode === "edit" &&
        initialData?.poId === watchedPoId &&
        !hasLoadedInitialData
      ) {
        return;
      }

      setIsLoadingPO(true);
      try {
        const po = await getPurchaseOrder(watchedPoId);

        if (po?.lineItems && po.lineItems.length > 0) {
          // Auto-populate line items from PO
          const poLineItems = po.lineItems.map((item: any, index: number) => ({
            description: item.description,
            quantity: Number(item.quantity),
            poLineItemId: item.id,
            poUnitPrice: Number(item.unitPrice),
            poAmount: Number(item.amount),
            // Pre-fill vendor amount with PO amount (editable by user)
            unitPrice: Number(item.unitPrice),
            amount: Number(item.amount),
            sortOrder: index,
          }));

          // Replace line items with PO line items
          form.setValue("lineItems", poLineItems);

          // Also set currency and vendor from PO if not already set
          if (po.currencyId && !form.getValues("currencyId")) {
            form.setValue("currencyId", po.currencyId);
          }
          if (po.vendorId && !form.getValues("vendorId")) {
            form.setValue("vendorId", po.vendorId);
          }

          toast.success(
            `Loaded ${po.lineItems.length} line items from Purchase Order`,
          );
        }
      } catch (error) {
        console.error("Error loading PO line items:", error);
        toast.error("Failed to load Purchase Order line items");
      } finally {
        setIsLoadingPO(false);
      }
    }

    loadPOLineItems();
  }, [watchedPoId, form, mode, initialData, hasLoadedInitialData]);

  // Check for duplicates
  const watchedVendorId = form.watch("vendorId");
  const watchedVendorInvoiceNumber = form.watch("vendorInvoiceNumber");
  const watchedBillDate = form.watch("billDate");

  useEffect(() => {
    const checkDuplicate = async () => {
      if (!watchedVendorId || !watchedVendorInvoiceNumber || !watchedBillDate) {
        setDuplicateCheck(null);
        return;
      }

      // Calculate total
      const total = calculateTotals().total;

      setIsCheckingDuplicate(true);
      try {
        const result = await checkForDuplicateBill(
          watchedVendorId,
          watchedVendorInvoiceNumber,
          Number.parseFloat(total),
          format(watchedBillDate, "yyyy-MM-dd"),
        );

        if (result.isDuplicate) {
          setDuplicateCheck(result);
        } else {
          setDuplicateCheck(null);
        }
      } catch (error) {
        console.error("Error checking for duplicates:", error);
      } finally {
        setIsCheckingDuplicate(false);
      }
    };

    // Debounce the duplicate check
    const timeoutId = setTimeout(checkDuplicate, 500);
    return () => clearTimeout(timeoutId);
  }, [watchedVendorId, watchedVendorInvoiceNumber, watchedBillDate]);

  async function onSubmit(values: BillFormValues) {
    setIsSubmitting(true);

    try {
      const billData = {
        ...values,
        billDate: format(values.billDate, "yyyy-MM-dd"),
        dueDate: format(values.dueDate, "yyyy-MM-dd"),
        receivedDate: format(values.receivedDate, "yyyy-MM-dd"),
        recurringEndDate: values.recurringEndDate
          ? format(values.recurringEndDate, "yyyy-MM-dd")
          : undefined,
      };

      const result =
        mode === "create"
          ? await createBill(billData as any)
          : await updateBill(billId!, billData as any);

      if (result.error) {
        toast.error(result.error.reason || "Failed to save bill");
        return;
      }

      toast.success(
        mode === "create"
          ? "Bill created successfully"
          : "Bill updated successfully",
      );

      router.push("/payables/bills");
      router.refresh();
    } catch (error) {
      console.error("Error submitting bill form:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  const calculateTotals = () => {
    const lineItems = form.watch("lineItems");
    const taxes = form.watch("taxes");
    const { subtotal, taxAmount, total } = calculateBillAmounts(
      lineItems as any,
      taxes as any,
    );
    return {
      subtotal: subtotal.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      total: total.toFixed(2),
    };
  };

  const totals = calculateTotals();

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Duplicate Warning */}
        {duplicateCheck?.isDuplicate && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>
              Potential Duplicate Bill (
              {duplicateCheck.confidence.toUpperCase()} confidence)
            </AlertTitle>
            <AlertDescription>
              <div className="mt-2 space-y-1">
                <p>
                  Similar bills found for this vendor. Please review before
                  continuing:
                </p>
                <ul className="list-disc list-inside mt-2">
                  {duplicateCheck.matches.map((match: any) => (
                    <li key={match.billId} className="text-sm">
                      {match.billNumber} - {match.vendorInvoiceNumber} - $
                      {match.amount} ({match.reason})
                    </li>
                  ))}
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Bill Details</CardTitle>
            <CardDescription>Enter the bill information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="billNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bill Number *</FormLabel>
                    <FormControl>
                      <Input placeholder="BILL-2026-0001" {...field} disabled />
                    </FormControl>
                    <FormDescription>
                      Auto-generated bill number
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vendorInvoiceNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vendor Invoice Number *</FormLabel>
                    <FormControl>
                      <Input placeholder="INV-12345" {...field} />
                    </FormControl>
                    <FormDescription>
                      Vendor's invoice/bill number
                      {isCheckingDuplicate && (
                        <span className="ml-2 text-xs">
                          (Checking for duplicates...)
                        </span>
                      )}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vendorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vendor *</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(Number(value))}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select vendor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {vendors.map((vendor) => (
                          <SelectItem
                            key={vendor.id}
                            value={vendor.id.toString()}
                          >
                            {vendor.name} ({vendor.vendorCode})
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
                name="poId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Link to PO (Optional)</FormLabel>
                    <Select
                      onValueChange={(value) =>
                        field.onChange(value ? Number(value) : undefined)
                      }
                      value={field.value?.toString() || "none"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="No PO" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No PO</SelectItem>
                        {purchaseOrders.map((po) => (
                          <SelectItem key={po.id} value={po.id.toString()}>
                            {po.poNumber} - {po.vendorName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Link to purchase order for 3-way matching
                    </FormDescription>
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
                            {currency.currencyCode} - {currency.currencyName}
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
                name="billDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Bill Date *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "pl-3 text-left font-normal",
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
                              "pl-3 text-left font-normal",
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
                name="receivedDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Received Date *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "pl-3 text-left font-normal",
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
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      When we received this bill from vendor
                    </FormDescription>
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
            <CardDescription>Items on this bill</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              {lineItemFields.map((field, index) => (
                <Card key={field.id} className="border-muted">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-sm font-medium">Item {index + 1}</h4>
                      {lineItemFields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeLineItem(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        <div className="md:col-span-12">
                          <FormField
                            control={form.control}
                            name={`lineItems.${index}.description`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description *</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Item description"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        <div className="md:col-span-3">
                          <FormField
                            control={form.control}
                            name={`lineItems.${index}.quantity`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Quantity *</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="1"
                                    {...field}
                                    onChange={(e) =>
                                      field.onChange(
                                        Number.parseFloat(e.target.value) || 0,
                                      )
                                    }
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Show PO Amount if this line item is from a PO */}
                        {form.watch(`lineItems.${index}.poUnitPrice`) !=
                          null && (
                          <>
                            <div className="md:col-span-3">
                              <FormField
                                control={form.control}
                                name={`lineItems.${index}.poUnitPrice`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>PO Unit Price</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        {...field}
                                        disabled
                                        className="bg-muted"
                                      />
                                    </FormControl>
                                    <FormDescription className="text-xs">
                                      From Purchase Order
                                    </FormDescription>
                                  </FormItem>
                                )}
                              />
                            </div>

                            <div className="md:col-span-3">
                              <FormField
                                control={form.control}
                                name={`lineItems.${index}.poAmount`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>PO Amount</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        {...field}
                                        disabled
                                        className="bg-muted"
                                      />
                                    </FormControl>
                                    <FormDescription className="text-xs">
                                      From Purchase Order
                                    </FormDescription>
                                  </FormItem>
                                )}
                              />
                            </div>
                          </>
                        )}

                        <div className="md:col-span-3">
                          <FormField
                            control={form.control}
                            name={`lineItems.${index}.unitPrice`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Vendor Unit Price
                                  {form.watch(
                                    `lineItems.${index}.poUnitPrice`,
                                  ) != null && (
                                    <span className="text-xs font-normal text-muted-foreground ml-1">
                                      (Editable)
                                    </span>
                                  )}
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    {...field}
                                    onChange={(e) =>
                                      field.onChange(
                                        Number.parseFloat(e.target.value) || 0,
                                      )
                                    }
                                  />
                                </FormControl>
                                <FormDescription className="text-xs">
                                  Actual price from vendor
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {form.watch(`lineItems.${index}.poAmount`) == null && (
                          <div className="md:col-span-3">
                            <FormField
                              control={form.control}
                              name={`lineItems.${index}.amount`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Amount</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      {...field}
                                      disabled
                                      className="bg-muted"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        )}
                      </div>

                      {/* Show variance if PO amount exists and differs from vendor amount */}
                      {form.watch(`lineItems.${index}.poAmount`) != null && (
                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                          <div className="flex items-center gap-4 text-sm">
                            <div>
                              <span className="font-medium">
                                Vendor Amount:{" "}
                              </span>
                              <span>
                                $
                                {(
                                  (form.watch(`lineItems.${index}.quantity`) ||
                                    0) *
                                  (form.watch(`lineItems.${index}.unitPrice`) ||
                                    0)
                                ).toFixed(2)}
                              </span>
                            </div>
                            {(() => {
                              const poAmt =
                                form.watch(`lineItems.${index}.poAmount`) || 0;
                              // Calculate vendor amount directly from quantity * unitPrice
                              const quantity =
                                form.watch(`lineItems.${index}.quantity`) || 0;
                              const unitPrice =
                                form.watch(`lineItems.${index}.unitPrice`) || 0;
                              const vendorAmt = quantity * unitPrice;
                              const variance = vendorAmt - poAmt;
                              const variancePercent =
                                poAmt > 0
                                  ? ((variance / poAmt) * 100).toFixed(2)
                                  : 0;

                              // Use tolerance for floating-point comparison (0.01 = 1 cent)
                              return Math.abs(variance) > 0.01 ? (
                                <div
                                  className={cn(
                                    "font-medium",
                                    variance > 0
                                      ? "text-red-600"
                                      : "text-green-600",
                                  )}
                                >
                                  <span>
                                    Variance: {variance > 0 ? "+" : ""}$
                                    {variance.toFixed(2)} (
                                    {variance > 0 ? "+" : ""}
                                    {variancePercent}%)
                                  </span>
                                </div>
                              ) : (
                                <div className="text-green-600 font-medium">
                                  <span>✓ Matches PO</span>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
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
                  sortOrder: lineItemFields.length,
                })
              }
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Line Item
            </Button>
          </CardContent>
        </Card>

        {/* Taxes */}
        <Card>
          <CardHeader>
            <CardTitle>Taxes</CardTitle>
            <CardDescription>Tax information for this bill</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              {taxFields.map((field, index) => (
                <Card key={field.id} className="border-muted">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-sm font-medium">Tax {index + 1}</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTax(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`taxes.${index}.taxType`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tax Type *</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select tax type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="VAT">VAT</SelectItem>
                                <SelectItem value="WHT">
                                  Withholding Tax (WHT)
                                </SelectItem>
                                <SelectItem value="Sales Tax">
                                  Sales Tax
                                </SelectItem>
                                <SelectItem value="GST">GST</SelectItem>
                                <SelectItem value="Custom">Custom</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`taxes.${index}.taxName`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tax Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., VAT 7.5%" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`taxes.${index}.taxPercentage`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tax Percentage *</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="7.5"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(
                                    Number.parseFloat(e.target.value) || 0,
                                  )
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`taxes.${index}.taxAmount`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tax Amount</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                {...field}
                                disabled
                                className="bg-muted"
                              />
                            </FormControl>
                            <FormDescription>
                              Calculated automatically
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`taxes.${index}.isWithholdingTax`}
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 pt-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Withholding Tax</FormLabel>
                              <FormDescription>
                                This is a withholding tax
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />

                      {form.watch(`taxes.${index}.isWithholdingTax`) && (
                        <FormField
                          control={form.control}
                          name={`taxes.${index}.whtCertificateNumber`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>WHT Certificate Number</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Certificate number"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                appendTax({
                  taxType: "VAT",
                  taxName: "",
                  taxPercentage: 0,
                  taxAmount: 0,
                  isWithholdingTax: false,
                  whtCertificateNumber: "",
                })
              }
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Tax
            </Button>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-full md:w-1/3 space-y-2 border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span className="font-medium">${totals.subtotal}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax:</span>
                  <span className="font-medium">${totals.taxAmount}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span>${totals.total}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
            <CardDescription>Notes and recurring settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="paymentTerms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Terms</FormLabel>
                  <FormControl>
                    <Input placeholder="Net 30, Net 60, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional notes..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isRecurring"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Recurring Bill</FormLabel>
                    <FormDescription>
                      This is a recurring bill (e.g., rent, utilities)
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {form.watch("isRecurring") && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="recurringFrequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frequency</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Monthly, Quarterly, Yearly"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="recurringEndDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>End Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "pl-3 text-left font-normal",
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
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/payables/bills")}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || duplicateCheck?.confidence === "high"}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "create" ? "Create Bill" : "Update Bill"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
