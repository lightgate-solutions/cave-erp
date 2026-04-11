"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { format } from "date-fns";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DatePickerWithRange } from "@/components/finance/date-range-picker";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Download, FileSpreadsheet, FileType } from "lucide-react";
import { toast } from "sonner";
import type { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";

export interface AccountActivityLine {
  id: number;
  journalId: number;
  description: string | null;
  debit: string;
  credit: string;
  journalNumber: string | null;
  journalDescription: string | null;
  transactionDate: string | null;
  source: string;
  status: string;
}

export interface AccountActivityCardProps {
  accountCode: string;
  accountName: string;
  activity: AccountActivityLine[];
  /** Total journal lines matching filters (all pages). */
  total: number;
  page: number;
  pageSize: number;
  /** Balance carried from lines before this page. */
  priorBalance: number;
  startParam?: string;
  endParam?: string;
}

function fmtMoney(n: number) {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function lineNetChange(line: AccountActivityLine): number {
  return Number(line.debit) - Number(line.credit);
}

function formatSignedChange(change: number): string {
  const s = fmtMoney(Math.abs(change));
  if (change > 0) return `+${s}`;
  if (change < 0) return `-${s}`;
  return fmtMoney(0);
}

function lineLabel(line: AccountActivityLine): string {
  const t = (line.description ?? line.journalDescription ?? "").trim();
  return t || "—";
}

function escapeCsvCell(value: string | number): string {
  const s = String(value);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function downloadCsv(filename: string, csvContent: string) {
  const blob = new Blob([`\uFEFF${csvContent}`], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function AccountActivityCard({
  accountCode,
  accountName,
  activity,
  total,
  page,
  pageSize,
  priorBalance,
  startParam,
  endParam,
}: AccountActivityCardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const dateRange: DateRange | undefined =
    startParam && endParam
      ? {
          from: new Date(startParam),
          to: new Date(endParam),
        }
      : startParam
        ? { from: new Date(startParam), to: undefined }
        : undefined;

  const setDateRange = useCallback(
    (range: DateRange | undefined) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("page");
      if (range?.from) {
        params.set("start", format(range.from, "yyyy-MM-dd"));
      } else {
        params.delete("start");
      }
      if (range?.to) {
        params.set("end", format(range.to, "yyyy-MM-dd"));
      } else {
        params.delete("end");
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams],
  );

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const displayPage = Math.min(page, totalPages);

  const goToPage = useCallback(
    (p: number) => {
      const params = new URLSearchParams(searchParams.toString());
      if (p <= 1) {
        params.delete("page");
      } else {
        params.set("page", String(p));
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams],
  );

  const exportCsv = useCallback(() => {
    const rows: string[][] = [
      ["Transaction History", `${accountCode} - ${accountName}`],
      [
        "Date range",
        dateRange?.from && dateRange?.to
          ? `${format(dateRange.from, "PP")} - ${format(dateRange.to, "PP")}`
          : "All",
      ],
      ["Page", `${displayPage} of ${totalPages} (${pageSize} lines per page)`],
      ["Opening balance (this page)", fmtMoney(priorBalance)],
      [],
      [
        "Date",
        "Journal",
        "Description",
        "Source",
        "Change (Dr − Cr)",
        "Running balance",
      ],
    ];
    let running = priorBalance;
    for (const line of activity) {
      const ch = lineNetChange(line);
      running += ch;
      rows.push([
        line.transactionDate
          ? format(new Date(line.transactionDate), "yyyy-MM-dd")
          : "",
        line.journalNumber ?? "",
        (line.description ?? line.journalDescription ?? "").replace(
          /[\r\n]+/g,
          " ",
        ),
        line.source,
        formatSignedChange(ch),
        fmtMoney(running),
      ]);
    }
    const csv = rows.map((row) => row.map(escapeCsvCell).join(",")).join("\n");
    const filename = `Account_${accountCode}_${accountName.replace(/\s+/g, "_")}_${dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : "all"}_${dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : "all"}.csv`;
    downloadCsv(filename, csv);
    toast.success("Exported as CSV");
  }, [
    accountCode,
    accountName,
    activity,
    dateRange,
    displayPage,
    totalPages,
    pageSize,
    priorBalance,
  ]);

  const exportPdf = useCallback(async () => {
    try {
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text(`${accountCode} - ${accountName}`, 14, 16);
      doc.setFontSize(10);
      doc.text(
        dateRange?.from && dateRange?.to
          ? `Period: ${format(dateRange.from, "PP")} - ${format(dateRange.to, "PP")}`
          : "Transaction History (all)",
        14,
        24,
      );
      doc.text(
        `Page ${displayPage} of ${totalPages} · Opening balance: ${fmtMoney(priorBalance)}`,
        14,
        30,
      );
      let run = priorBalance;
      const body = activity.map((line) => {
        const ch = lineNetChange(line);
        run += ch;
        return [
          line.transactionDate
            ? format(new Date(line.transactionDate), "yyyy-MM-dd")
            : "—",
          line.journalNumber ?? "—",
          (line.description ?? line.journalDescription ?? "—").slice(0, 40),
          line.source,
          formatSignedChange(ch),
          fmtMoney(run),
        ];
      });
      autoTable(doc, {
        startY: 36,
        head: [
          ["Date", "Journal", "Description", "Source", "Change", "Balance"],
        ],
        body,
        theme: "grid",
        headStyles: { fillColor: [66, 66, 66] },
        margin: { left: 14 },
      });
      const filename = `Account_${accountCode}_transactions_${format(new Date(), "yyyy-MM-dd")}.pdf`;
      doc.save(filename);
      toast.success("Exported as PDF");
    } catch (e) {
      console.error(e);
      toast.error("Failed to export PDF");
    }
  }, [
    accountCode,
    accountName,
    activity,
    dateRange,
    displayPage,
    totalPages,
    priorBalance,
  ]);

  const rowsWithRunning = useMemo(() => {
    let running = priorBalance;
    return activity.map((line) => {
      const change = lineNetChange(line);
      running += change;
      return { line, change, balance: running };
    });
  }, [activity, priorBalance]);

  const endingBalance =
    rowsWithRunning.length > 0
      ? rowsWithRunning[rowsWithRunning.length - 1].balance
      : 0;

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            Oldest to newest; change is debit − credit; running balance includes
            prior activity. {pageSize} lines per page
            {dateRange?.from && dateRange?.to
              ? ` (${format(dateRange.from, "PP")} - ${format(dateRange.to, "PP")})`
              : " (all)"}
          </CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DatePickerWithRange date={dateRange} setDate={setDateRange} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={exportCsv}
                disabled={activity.length === 0}
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={exportPdf}
                disabled={activity.length === 0}
              >
                <FileType className="mr-2 h-4 w-4" />
                Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No transactions in this period. Adjust the date filter or post
            journal entries to see activity.
          </p>
        ) : (
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
              Showing {total > 0 ? (displayPage - 1) * pageSize + 1 : 0}–
              {Math.min(displayPage * pageSize, total)} of {total} line
              {total === 1 ? "" : "s"}
              {totalPages > 1 ? ` · Page ${displayPage} of ${totalPages}` : ""}
            </p>

            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Ledger (oldest → newest)
              </p>
              {displayPage > 1 ? (
                <p className="mb-3 text-xs text-muted-foreground">
                  Balance before this page:{" "}
                  <span className="font-mono font-medium text-foreground">
                    {fmtMoney(priorBalance)}
                  </span>
                </p>
              ) : null}
              <div className="space-y-1.5 font-mono text-sm tabular-nums">
                {rowsWithRunning.map(({ line, change }) => (
                  <div
                    key={line.id}
                    className="flex flex-wrap items-baseline gap-x-3 gap-y-1"
                  >
                    <span
                      className={cn(
                        "min-w-[9rem] shrink-0 text-right sm:min-w-[10rem]",
                        change > 0 && "text-emerald-700 dark:text-emerald-400",
                        change < 0 && "text-rose-700 dark:text-rose-400",
                        change === 0 && "text-muted-foreground",
                      )}
                    >
                      {formatSignedChange(change)}
                    </span>
                    <span className="text-muted-foreground">
                      ({lineLabel(line)})
                    </span>
                  </div>
                ))}
                <div className="flex flex-wrap items-baseline gap-2 border-t border-border pt-3 text-base font-semibold">
                  <span>=</span>
                  <span>{fmtMoney(endingBalance)}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    (balance after this page)
                  </span>
                </div>
              </div>
            </div>

            <div className="border rounded-md overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Journal</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead className="text-right">Change</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rowsWithRunning.map(({ line, change, balance }) => (
                    <TableRow key={line.id}>
                      <TableCell className="text-sm whitespace-nowrap">
                        {line.transactionDate
                          ? new Date(line.transactionDate).toLocaleDateString()
                          : "—"}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {line.journalNumber ?? "—"}
                      </TableCell>
                      <TableCell className="max-w-[220px] truncate text-sm">
                        {line.description ?? line.journalDescription ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {line.source}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right font-mono text-sm",
                          change > 0 &&
                            "text-emerald-700 dark:text-emerald-400",
                          change < 0 && "text-rose-700 dark:text-rose-400",
                        )}
                      >
                        {formatSignedChange(change)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {fmtMoney(balance)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Pagination className="mx-0 w-full justify-center sm:justify-end">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => goToPage(displayPage - 1)}
                        className={
                          displayPage <= 1
                            ? "pointer-events-none opacity-50"
                            : undefined
                        }
                      />
                    </PaginationItem>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(
                        (p) =>
                          p === 1 ||
                          p === totalPages ||
                          (p >= displayPage - 1 && p <= displayPage + 1),
                      )
                      .map((p, idx, arr) => (
                        <div key={p} className="flex items-center">
                          {idx > 0 && arr[idx - 1] !== p - 1 ? (
                            <PaginationItem>
                              <span className="flex size-9 items-center justify-center px-1 text-muted-foreground">
                                …
                              </span>
                            </PaginationItem>
                          ) : null}
                          <PaginationItem>
                            <PaginationLink
                              onClick={() => goToPage(p)}
                              isActive={p === displayPage}
                            >
                              {p}
                            </PaginationLink>
                          </PaginationItem>
                        </div>
                      ))}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => goToPage(displayPage + 1)}
                        className={
                          displayPage >= totalPages
                            ? "pointer-events-none opacity-50"
                            : undefined
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
