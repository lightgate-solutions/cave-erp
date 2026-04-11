"use client";

import type React from "react";
import { useState, useTransition, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Plus, Search, Loader2, Eye, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import {
  createAccount,
  deleteAccount,
  getChartOfAccounts,
  updateAccount,
} from "@/actions/finance/gl/accounts";

import { authClient } from "@/lib/auth-client";

import type { AccountFormValues } from "@/actions/finance/gl/accounts";

interface Account {
  id: number;
  code: string;
  name: string;
  type: string;
  currentBalance: string;
  isActive: boolean;
  isSystem?: boolean;
  description?: string | null;
  allowManualJournals?: boolean;
}

const emptyForm = {
  code: "",
  name: "",
  type: "Asset",
  description: "",
  allowManualJournals: true,
};

export default function ChartOfAccountsPage() {
  const { data: session } = authClient.useSession();
  const organizationId = session?.session?.activeOrganizationId;
  const isAdmin = session?.user?.role === "admin";

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null);
  const [isPending, startTransition] = useTransition();

  const [formData, setFormData] = useState(emptyForm);
  const [editForm, setEditForm] = useState(emptyForm);

  const fetchAccounts = useCallback(async () => {
    if (!organizationId) {
      setAccounts([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const result = await getChartOfAccounts(organizationId);
    if (result.success && result.data) {
      setAccounts(result.data as Account[]);
    } else {
      toast.error("Failed to fetch accounts");
    }
    setIsLoading(false);
  }, [organizationId]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleCreate = () => {
    if (!organizationId) {
      toast.error("Organization not found");
      return;
    }
    startTransition(async () => {
      const result = await createAccount({
        ...formData,
        organizationId,
        type: formData.type as AccountFormValues["type"],
      });

      if (result.success) {
        toast.success("Account created successfully");
        setIsCreateOpen(false);
        setFormData(emptyForm);
        fetchAccounts();
      } else {
        toast.error(result.error || "Failed to create account");
      }
    });
  };

  const openEdit = (account: Account) => {
    setEditingAccount(account);
    setEditForm({
      code: account.code,
      name: account.name,
      type: account.type,
      description: account.description ?? "",
      allowManualJournals: account.allowManualJournals ?? true,
    });
    setIsEditOpen(true);
  };

  const handleUpdate = () => {
    if (!editingAccount || !organizationId) return;
    startTransition(async () => {
      const payload: Partial<Omit<AccountFormValues, "organizationId">> = {
        name: editForm.name,
        type: editForm.type as AccountFormValues["type"],
        description: editForm.description || undefined,
        allowManualJournals: editForm.allowManualJournals,
      };
      if (!editingAccount.isSystem) {
        payload.code = editForm.code;
      }

      const result = await updateAccount(editingAccount.id, payload);

      if (result.success) {
        toast.success("Account updated");
        setIsEditOpen(false);
        setEditingAccount(null);
        fetchAccounts();
      } else {
        toast.error(result.error || "Failed to update account");
      }
    });
  };

  const handleDelete = () => {
    if (!deleteTarget || !organizationId) return;
    startTransition(async () => {
      const result = await deleteAccount(deleteTarget.id, organizationId);
      if (result.success) {
        toast.success("Account deleted");
        setDeleteTarget(null);
        fetchAccounts();
      } else {
        toast.error(result.error || "Failed to delete account");
      }
    });
  };

  const filteredAccounts = accounts.filter(
    (acc) =>
      acc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.code.includes(searchTerm),
  );

  const accountFormFields = (
    data: typeof emptyForm,
    setData: React.Dispatch<React.SetStateAction<typeof emptyForm>>,
    options: { codeDisabled?: boolean; codeHint?: string; idPrefix: string },
  ) => {
    const p = options.idPrefix;
    return (
      <>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor={`${p}-code`} className="text-right">
            Code
          </Label>
          <div className="col-span-3 space-y-1">
            <Input
              id={`${p}-code`}
              value={data.code}
              disabled={options.codeDisabled}
              onChange={(e) =>
                setData((prev) => ({ ...prev, code: e.target.value }))
              }
              placeholder="e.g. 1010"
            />
            {options.codeHint ? (
              <p className="text-xs text-muted-foreground">
                {options.codeHint}
              </p>
            ) : null}
          </div>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor={`${p}-name`} className="text-right">
            Name
          </Label>
          <Input
            id={`${p}-name`}
            value={data.name}
            onChange={(e) =>
              setData((prev) => ({ ...prev, name: e.target.value }))
            }
            className="col-span-3"
            placeholder="e.g. Petty Cash"
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor={`${p}-type`} className="text-right">
            Type
          </Label>
          <div className="col-span-3">
            <Select
              value={data.type}
              onValueChange={(val) =>
                setData((prev) => ({ ...prev, type: val }))
              }
            >
              <SelectTrigger id={`${p}-type`} className="w-full">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Asset">Asset</SelectItem>
                <SelectItem value="Liability">Liability</SelectItem>
                <SelectItem value="Equity">Equity</SelectItem>
                <SelectItem value="Income">Income</SelectItem>
                <SelectItem value="Expense">Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor={`${p}-description`} className="text-right">
            Description
          </Label>
          <Input
            id={`${p}-description`}
            value={data.description}
            onChange={(e) =>
              setData((prev) => ({ ...prev, description: e.target.value }))
            }
            className="col-span-3"
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <div className="col-start-2 col-span-3 flex items-center space-x-2">
            <Checkbox
              id={`${p}-allowManualJournals`}
              checked={data.allowManualJournals}
              onCheckedChange={(checked) =>
                setData((prev) => ({
                  ...prev,
                  allowManualJournals: checked as boolean,
                }))
              }
            />
            <Label
              htmlFor={`${p}-allowManualJournals`}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Allow Manual Journals
            </Label>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Chart of Accounts
          </h1>
          <p className="text-muted-foreground">
            {organizationId
              ? "Manage your General Ledger accounts and hierarchy."
              : "Select an organization to manage the chart of accounts."}
          </p>
        </div>
        {organizationId ? (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button suppressHydrationWarning>
                <Plus className="mr-2 h-4 w-4" /> New Account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Account</DialogTitle>
                <DialogDescription>
                  Add a new account to your Chart of Accounts.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {accountFormFields(formData, setFormData, {
                  idPrefix: "coa-create",
                })}
              </div>
              <DialogFooter>
                <Button onClick={handleCreate} disabled={isPending}>
                  {isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Account
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ) : null}
      </div>

      <Dialog
        open={isEditOpen}
        onOpenChange={(open) => {
          setIsEditOpen(open);
          if (!open) setEditingAccount(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit account</DialogTitle>
            <DialogDescription>
              {editingAccount?.isSystem
                ? "System accounts keep a fixed code (used by invoicing and payables). You can change the display name and type."
                : "Update code, name, or type. Ensure the code stays unique."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {accountFormFields(editForm, setEditForm, {
              idPrefix: "coa-edit",
              codeDisabled: !!editingAccount?.isSystem,
              codeHint: editingAccount?.isSystem
                ? "This code is reserved for integrations and cannot be changed."
                : undefined,
            })}
          </div>
          <DialogFooter>
            <Button onClick={handleUpdate} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete account?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone. If this account has journal activity,
              deletion may fail until those entries are adjusted.
              {deleteTarget ? (
                <>
                  {" "}
                  <span className="font-medium text-foreground">
                    {deleteTarget.code} — {deleteTarget.name}
                  </span>
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={isPending}
              onClick={() => handleDelete()}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Delete"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search accounts..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[140px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!organizationId ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground"
                >
                  Choose an organization from the workspace switcher to load
                  accounts.
                </TableCell>
              </TableRow>
            ) : isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : filteredAccounts.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground"
                >
                  No accounts found. Create one to get started.
                </TableCell>
              </TableRow>
            ) : (
              filteredAccounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="font-medium">{account.code}</TableCell>
                  <TableCell>{account.name}</TableCell>
                  <TableCell>{account.type}</TableCell>
                  <TableCell className="text-right font-mono">
                    {Number(account.currentBalance) === 0
                      ? "-"
                      : Number(account.currentBalance).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        account.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {account.isActive ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-0.5">
                      <Button variant="ghost" size="icon" asChild>
                        <Link
                          href={`/finance/gl/accounts/${account.id}`}
                          title="View account details and transaction history"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        title="Edit account"
                        onClick={() => openEdit(account)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {isAdmin && !account.isSystem ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          title="Delete account (admin only)"
                          onClick={() => setDeleteTarget(account)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
