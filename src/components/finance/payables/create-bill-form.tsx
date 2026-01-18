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

import { createBill, updateBill } from "@/actions/finance/payables/bills";
import { getAllSuppliers } from "@/actions/finance/payables/suppliers";
import { getAllOrganizationCurrencies } from "@/actions/invoicing/currencies";

// Types needed for initial data
interface BillData {
  id: number;
  billNumber: string;
  supplierId: number;
  currencyId: number;
  billDate: string;
  dueDate: string;
  notes?: string | null;
  items: {
    description: string;
    category?: string | null;
    quantity: string;
    unitPrice: string;
  }[];
}

interface BillFormProps {
  initialData?: BillData;
}

const lineItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  category: z.string().optional(),
  quantity: z.number().min(0.01, "Quantity must be greater than 0"),
  unitPrice: z.number().min(0, "Unit price must be non-negative"),
  amount: z.number(),
});

const billFormSchema = z.object({
  billNumber: z.string().min(1, "Bill number is required"),
  supplierId: z.number().min(1, "Supplier is required"),
  currencyId: z.number().min(1, "Currency is required"),
  billDate: z.date(),
  dueDate: z.date(),
  lineItems: z
    .array(lineItemSchema)
    .min(1, "At least one line item is required"),
  notes: z.string().optional(),
});

type BillFormValues = z.infer<typeof billFormSchema>;

export function BillForm({ initialData }: BillFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suppliers, setSuppliers] = useState<
    Awaited<ReturnType<typeof getAllSuppliers>>
  >([]);
  const [currencies, setCurrencies] = useState<
    Awaited<ReturnType<typeof getAllOrganizationCurrencies>>
  >([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const form = useForm<BillFormValues>({
    resolver: zodResolver(billFormSchema),
    defaultValues: {
      billNumber: initialData?.billNumber || "",
      supplierId: initialData?.supplierId || 0,
      currencyId: initialData?.currencyId || 0,
      billDate: initialData?.billDate
        ? new Date(initialData.billDate)
        : new Date(),
      dueDate: initialData?.dueDate
        ? new Date(initialData.dueDate)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      lineItems: initialData?.items?.length
        ? initialData.items.map((item) => ({
            description: item.description,
            category: item.category || undefined,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
            amount: Number(item.quantity) * Number(item.unitPrice),
          }))
        : [{ description: "", quantity: 1, unitPrice: 0, amount: 0 }],
      notes: initialData?.notes || "",
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

  // Load suppliers and currencies
  useEffect(() => {
    async function loadData() {
      setIsLoadingData(true);
      try {
        const [suppliersData, currenciesData] = await Promise.all([
          getAllSuppliers({ isActive: true }),
          getAllOrganizationCurrencies(),
        ]);

        setSuppliers(suppliersData);
        setCurrencies(currenciesData);

        // Set default currency if available and creating new
        if (
          !initialData &&
          currenciesData.length > 0 &&
          !form.getValues("currencyId")
        ) {
          const defaultCurrency =
            currenciesData.find((c) => c.isDefault) || currenciesData[0];
          form.setValue("currencyId", defaultCurrency.id);
        }
      } catch (error) {
        toast.error("Failed to load form data");
        console.error(error);
      } finally {
        setIsLoadingData(false);
      }
    }

    loadData();
  }, [form, initialData]);

  // Calculate amounts when line items changes
  useEffect(() => {
    const subscription = form.watch((_value: any, { name }) => {
      if (name?.endsWith(".amount")) {
        return;
      }

      if (name?.startsWith("lineItems")) {
        const lineItems = form.getValues("lineItems") || [];

        lineItems.forEach((item, index) => {
          if (!item) return;
          const amount = (item.quantity || 0) * (item.unitPrice || 0);
          const currentAmount = form.getValues(`lineItems.${index}.amount`);

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

  const watchedLineItems = form.watch("lineItems") || [];
  const subtotal = watchedLineItems.reduce(
    (acc, item) => acc + (item?.amount || 0),
    0,
  );
  const total = subtotal; // No separate tax yet for bills

  async function onSubmit(data: BillFormValues, status: "Draft" | "Open") {
    setIsSubmitting(true);

    try {
      const formattedDate = format(data.billDate, "yyyy-MM-dd");
      const formattedDueDate = format(data.dueDate, "yyyy-MM-dd");

      const result = initialData
        ? await updateBill(initialData.id, {
            ...data,
            billDate: formattedDate,
            dueDate: formattedDueDate,
            status,
          })
        : await createBill({
            ...data,
            billDate: formattedDate,
            dueDate: formattedDueDate,
            status,
          });

      if (result.success) {
        toast.success(
          initialData
            ? `Bill updated as ${status}`
            : `Bill created as ${status}`,
        );
        router.push(
          initialData
            ? `/finance/payables/bills/${initialData.id}`
            : "/finance/payables/bills",
        );
        router.refresh();
      } else {
        toast.error(result.error?.reason || "Failed to save bill");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error("Error submitting bill form:", error);
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
      <form
        onSubmit={form.handleSubmit((data) => onSubmit(data, "Open"))}
        className="space-y-6"
      >
        {/* Bill Details */}
        <Card>
          <CardHeader>
            <CardTitle>{initialData ? "Edit Bill" : "Bill Details"}</CardTitle>
            <CardDescription>
              {initialData
                ? "Update bill information"
                : "Enter details from the vendor's invoice"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="supplierId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier *</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(Number(value))}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select supplier" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {suppliers.map((supplier) => (
                          <SelectItem
                            key={supplier.id}
                            value={supplier.id.toString()}
                          >
                            {supplier.name}
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
                name="billNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bill Number *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g. INV-9999" />
                    </FormControl>
                    <FormDescription>Vendor's invoice number</FormDescription>
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

              <div className="grid grid-cols-2 gap-4">
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
                            disabled={(date) => date > new Date()}
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
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Line Items */}
        <Card>
          <CardHeader>
            <CardTitle>Line Items</CardTitle>
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
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Qty</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              step="0.01"
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                field.onChange(Number.isNaN(val) ? 0 : val);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="col-span-4 md:col-span-2">
                    <FormField
                      control={form.control}
                      name={`lineItems.${index}.unitPrice`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              step="0.01"
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                field.onChange(Number.isNaN(val) ? 0 : val);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="col-span-3 md:col-span-2">
                    <FormField
                      control={form.control}
                      name={`lineItems.${index}.amount`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount</FormLabel>
                          <FormControl>
                            <Input {...field} disabled />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
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

            <div className="flex justify-end text-lg font-bold border-t pt-4">
              <span className="mr-4">Total:</span>
              <span>{total.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Additional notes..."
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={form.handleSubmit((data) => onSubmit(data, "Draft"))}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save as Draft
          </Button>
          <Button
            type="button"
            disabled={isSubmitting}
            onClick={form.handleSubmit((data) => onSubmit(data, "Open"))}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData ? "Update & Open" : "Create & Open"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
