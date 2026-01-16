"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Star } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  createOrganizationCurrency,
  deleteOrganizationCurrency,
  setDefaultCurrency,
} from "@/actions/invoicing/currencies";

const currencyFormSchema = z.object({
  currencyCode: z
    .string()
    .min(3, "Currency code must be 3 characters")
    .max(3, "Currency code must be 3 characters")
    .toUpperCase(),
  currencySymbol: z.string().min(1, "Currency symbol is required"),
  currencyName: z.string().min(1, "Currency name is required"),
  exchangeRate: z.number().min(0, "Exchange rate must be positive"),
});

type CurrencyFormValues = z.infer<typeof currencyFormSchema>;

interface Currency {
  id: number;
  currencyCode: string;
  currencySymbol: string;
  currencyName: string;
  exchangeRate: string | null;
  isDefault: boolean;
}

interface CurrencySettingsProps {
  initialCurrencies: Currency[];
}

export function CurrencySettings({ initialCurrencies }: CurrencySettingsProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const form = useForm<CurrencyFormValues>({
    resolver: zodResolver(currencyFormSchema),
    defaultValues: {
      currencyCode: "",
      currencySymbol: "",
      currencyName: "",
      exchangeRate: 1.0,
    },
  });

  async function onSubmit(data: CurrencyFormValues) {
    setIsSubmitting(true);

    try {
      const result = await createOrganizationCurrency(data);

      if (result.success) {
        toast.success("Currency added successfully");
        setOpen(false);
        form.reset();
        router.refresh();
      } else {
        toast.error(result.error?.reason || "Failed to add currency");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error("Error adding currency:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    setDeletingId(id);

    try {
      const result = await deleteOrganizationCurrency(id);

      if (result.success) {
        toast.success("Currency deleted successfully");
        router.refresh();
      } else {
        toast.error(result.error?.reason || "Failed to delete currency");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error("Error deleting currency:", error);
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSetDefault(id: number) {
    try {
      const result = await setDefaultCurrency(id);

      if (result.success) {
        toast.success("Default currency updated");
        router.refresh();
      } else {
        toast.error(
          result.error?.reason || "Failed to update default currency",
        );
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error("Error setting default currency:", error);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Organization Currencies</CardTitle>
              <CardDescription>
                Manage currencies available for invoicing
              </CardDescription>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Currency
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Add Currency</DialogTitle>
                  <DialogDescription>
                    Add a new currency to your organization
                  </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="currencyCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Currency Code *</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="USD"
                              maxLength={3}
                              onChange={(e) =>
                                field.onChange(e.target.value.toUpperCase())
                              }
                            />
                          </FormControl>
                          <FormDescription>3-letter ISO code</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="currencySymbol"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Currency Symbol *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="$" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="currencyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Currency Name *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="US Dollar" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="exchangeRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Exchange Rate</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              step="0.000001"
                              onChange={(e) =>
                                field.onChange(
                                  Number.parseFloat(e.target.value) || 1.0,
                                )
                              }
                            />
                          </FormControl>
                          <FormDescription>
                            Relative to base currency (default: 1.0)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setOpen(false)}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Add Currency
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {initialCurrencies.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No currencies configured</p>
              <p className="text-sm mt-2">
                Add your first currency to get started
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {initialCurrencies.map((currency) => (
                <div
                  key={currency.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <span className="text-lg font-bold text-primary">
                        {currency.currencySymbol}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {currency.currencyCode} ({currency.currencySymbol})
                        </p>
                        {currency.isDefault && (
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800">
                            <Star className="mr-1 h-3 w-3 fill-current" />
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {currency.currencyName} • Rate:{" "}
                        {Number(currency.exchangeRate ?? 1).toFixed(6)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!currency.isDefault && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefault(currency.id)}
                      >
                        <Star className="mr-1 h-3 w-3" />
                        Set Default
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(currency.id)}
                      disabled={deletingId === currency.id}
                    >
                      {deletingId === currency.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
