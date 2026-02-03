"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";
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
import { Download, FileSpreadsheet, FileType } from "lucide-react";
import { toast } from "sonner";
import type { DateRange } from "react-day-picker";

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

interface AccountActivityCardProps {
  accountCode: string;
  accountName: string;
  activity: AccountActivityLine[];
  startParam?: string;
  endParam?: string;
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

  const exportCsv = useCallback(() => {
    const rows: string[][] = [
      ["Transaction History", `${accountCode} - ${accountName}`],
      [
        "Date range",
        dateRange?.from && dateRange?.to
          ? `${format(dateRange.from, "PP")} - ${format(dateRange.to, "PP")}`
          : "All",
      ],
      [],
      ["Date", "Journal", "Description", "Source", "Debit", "Credit"],
    ];
    for (const line of activity) {
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
        Number(line.debit) > 0 ? line.debit : "",
        Number(line.credit) > 0 ? line.credit : "",
      ]);
    }
    const csv = rows.map((row) => row.map(escapeCsvCell).join(",")).join("\n");
    const filename = `Account_${accountCode}_${accountName.replace(/\s+/g, "_")}_${dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : "all"}_${dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : "all"}.csv`;
    downloadCsv(filename, csv);
    toast.success("Exported as CSV");
  }, [accountCode, accountName, activity, dateRange]);

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
      const body = activity.map((line) => [
        line.transactionDate
          ? format(new Date(line.transactionDate), "yyyy-MM-dd")
          : "—",
        line.journalNumber ?? "—",
        (line.description ?? line.journalDescription ?? "—").slice(0, 40),
        line.source,
        Number(line.debit) > 0 ? line.debit : "—",
        Number(line.credit) > 0 ? line.credit : "—",
      ]);
      autoTable(doc, {
        startY: 30,
        head: [["Date", "Journal", "Description", "Source", "Debit", "Credit"]],
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
  }, [accountCode, accountName, activity, dateRange]);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            Journal entries affecting this account
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
        {activity.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No transactions in this period. Adjust the date filter or post
            journal entries to see activity.
          </p>
        ) : (
          <div className="border rounded-md overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Journal</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="text-right">Credit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activity.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell className="text-sm whitespace-nowrap">
                      {line.transactionDate
                        ? new Date(line.transactionDate).toLocaleDateString()
                        : "—"}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {line.journalNumber ?? "—"}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm">
                      {line.description ?? line.journalDescription ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {line.source}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {Number(line.debit) > 0
                        ? Number(line.debit).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                          })
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {Number(line.credit) > 0
                        ? Number(line.credit).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                          })
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
