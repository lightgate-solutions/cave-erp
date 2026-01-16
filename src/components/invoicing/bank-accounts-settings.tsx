"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Check, Landmark } from "lucide-react";

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
import { Switch } from "@/components/ui/switch";

import {
  createBankAccount,
  deleteBankAccount,
  updateBankAccount,
} from "@/actions/invoicing/bank-accounts";

const bankAccountFormSchema = z.object({
  accountName: z.string().min(1, "Account name is required"),
  bankName: z.string().min(1, "Bank name is required"),
  accountNumber: z.string().min(1, "Account number is required"),
  routingNumber: z.string().optional(),
  swiftCode: z.string().optional(),
  currency: z.string().min(3, "Currency code is required").max(3).toUpperCase(),
  isDefault: z.boolean(),
});

type BankAccountFormValues = z.infer<typeof bankAccountFormSchema>;

interface BankAccount {
  id: number;
  accountName: string;
  bankName: string;
  accountNumber: string;
  routingNumber: string | null;
  swiftCode: string | null;
  currency: string;
  isDefault: boolean;
  isActive: boolean;
}

interface BankAccountsSettingsProps {
  initialAccounts: BankAccount[];
}

export function BankAccountsSettings({
  initialAccounts,
}: BankAccountsSettingsProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const form = useForm<BankAccountFormValues>({
    resolver: zodResolver(bankAccountFormSchema),
    defaultValues: {
      accountName: "",
      bankName: "",
      accountNumber: "",
      routingNumber: "",
      swiftCode: "",
      currency: "USD",
      isDefault: false,
    },
  });

  async function onSubmit(data: BankAccountFormValues) {
    setIsSubmitting(true);

    try {
      const result = await createBankAccount(data);

      if (result.success) {
        toast.success("Bank account added successfully");
        setOpen(false);
        form.reset();
        router.refresh();
      } else {
        toast.error(result.error?.reason || "Failed to add bank account");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error("Error adding bank account:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    setDeletingId(id);

    try {
      const result = await deleteBankAccount(id);

      if (result.success) {
        toast.success("Bank account deleted successfully");
        router.refresh();
      } else {
        toast.error(result.error?.reason || "Failed to delete bank account");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error("Error deleting bank account:", error);
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSetDefault(id: number, currency: string) {
    try {
      const result = await updateBankAccount(id, { isDefault: true, currency });

      if (result.success) {
        toast.success("Default account updated");
        router.refresh();
      } else {
        toast.error(result.error?.reason || "Failed to update default account");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error("Error setting default account:", error);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Organization Bank Accounts</CardTitle>
              <CardDescription>
                Manage bank accounts for receiving invoice payments
              </CardDescription>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Account
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Add Bank Account</DialogTitle>
                  <DialogDescription>
                    Add a new bank account to your organization
                  </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="accountName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Name *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Business Checking" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="bankName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bank Name *</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Bank of America" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="currency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Currency *</FormLabel>
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
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="accountNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Number *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="1234567890" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="routingNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Routing Number</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Optional" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="swiftCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>SWIFT/BIC</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Optional" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="isDefault"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>Default Account</FormLabel>
                            <FormDescription>
                              Use this account as default for this currency
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
                        Add Account
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {initialAccounts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No bank accounts configured</p>
              <p className="text-sm mt-2">
                Add your first bank account to receive payments
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {initialAccounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Landmark className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {account.bankName} - {account.accountName}
                        </p>
                        {account.isDefault && (
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800">
                            <Check className="mr-1 h-3 w-3" />
                            Default ({account.currency})
                          </span>
                        )}
                        {!account.isDefault && (
                          <span className="text-xs text-muted-foreground border px-2 py-0.5 rounded-full">
                            {account.currency}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {account.accountNumber}
                        {account.swiftCode
                          ? ` • SWIFT: ${account.swiftCode}`
                          : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!account.isDefault && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleSetDefault(account.id, account.currency)
                        }
                      >
                        Set Default
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(account.id)}
                      disabled={deletingId === account.id}
                    >
                      {deletingId === account.id ? (
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
