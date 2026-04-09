"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Search, Filter, Download } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { ExpenseFormDialog } from "./expense-form-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

type Expense = {
  id: number;
  title: string;
  description: string | null;
  amount: string;
  category: string | null;
  expenseDate: string;
  createdAt: string;
  updatedAt: string;
  type: "company" | "project";
};

const expenseCategories = [
  "Office Supplies",
  "Utilities",
  "Rent",
  "Salaries",
  "Marketing",
  "Travel",
  "Equipment",
  "Maintenance",
  "Insurance",
  "Legal",
  "Project Expense",
  "Other",
];

export function ExpensesTable() {
  const [items, setItems] = useState<Expense[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, _setLimit] = useState(10);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        q,
      });
      if (category !== "all") params.set("category", category);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);

      const res = await fetch(`/api/finance/expenses?${params}`);
      const data = await res.json();
      setItems(data.expenses ?? []);
      setTotal(data.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [page, limit, q, category, dateFrom, dateTo]);

  useEffect(() => {
    load();
  }, [load]);

  async function exportCsv() {
    setExporting(true);
    try {
      const params = new URLSearchParams({ q, export: "csv" });
      if (category !== "all") params.set("category", category);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);

      const res = await fetch(`/api/finance/expenses?${params}`);
      if (!res.ok) {
        toast.error("Could not export expenses");
        return;
      }
      const blob = await res.blob();
      const cd = res.headers.get("Content-Disposition");
      let filename = "company-expenses.csv";
      const quoted = cd?.match(/filename="([^"]+)"/);
      if (quoted?.[1]) filename = quoted[1];

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Export downloaded");
    } catch {
      toast.error("Could not export expenses");
    } finally {
      setExporting(false);
    }
  }

  async function onDelete(id: number) {
    if (!confirm("Are you sure you want to delete this expense?")) {
      return;
    }
    try {
      await fetch(`/api/finance/expenses/${id}`, { method: "DELETE" });
      load();
      // Notify balance card to refresh
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("expenses:changed"));
      }
    } catch (_error) {
      toast.error("Error deleting expense:");
    }
  }

  const formatCurrency = (amount: string) => {
    const num = Number(amount);
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(num);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Expenses</CardTitle>
          <div className="flex flex-wrap gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={exporting}
              onClick={() => exportCsv()}
            >
              <Download className="h-4 w-4 mr-2" />
              {exporting ? "Exporting…" : "Export CSV"}
            </Button>
            <ExpenseFormDialog
              onCompleted={() => {
                load();
              }}
              trigger={<Button>New Expense</Button>}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search expenses..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={category}
              onValueChange={(v) => {
                setCategory(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="All categories" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {expenseCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
              <Label htmlFor="expense-date-from" className="text-xs">
                From (expense date)
              </Label>
              <Input
                id="expense-date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(1);
                }}
                className="w-full sm:max-w-[200px]"
              />
            </div>
            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
              <Label htmlFor="expense-date-to" className="text-xs">
                To (expense date)
              </Label>
              <Input
                id="expense-date-to"
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(1);
                }}
                className="w-full sm:max-w-[200px]"
              />
            </div>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center h-24 text-muted-foreground"
                  >
                    No expenses found
                  </TableCell>
                </TableRow>
              ) : (
                items.map((expense) => (
                  <TableRow key={expense.id} className="group">
                    <TableCell className="font-medium">
                      {expense.title}
                    </TableCell>
                    <TableCell>
                      {expense.category ? (
                        <Badge variant="secondary" className="font-normal">
                          {expense.category}
                        </Badge>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="font-semibold text-red-600 dark:text-red-400">
                      {formatCurrency(expense.amount)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(expense.expenseDate)}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">
                      {expense.description || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {expense.type === "project" ? (
                        <div className="flex justify-end opacity-70">
                          <Badge
                            variant="outline"
                            className="font-normal text-xs"
                          >
                            Project Exp.
                          </Badge>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <ExpenseFormDialog
                            initial={expense}
                            onCompleted={() => {
                              load();
                            }}
                            trigger={
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                aria-label="Edit expense"
                                title="Edit"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            }
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => onDelete(expense.id)}
                            aria-label="Delete expense"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {total > limit ? (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setPage((p) => Math.max(1, p - 1));
                  }}
                />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink isActive href="#">
                  {page}
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    const totalPages = Math.max(1, Math.ceil(total / limit));
                    setPage((p) => Math.min(totalPages, p + 1));
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        ) : null}
      </CardContent>
    </Card>
  );
}
