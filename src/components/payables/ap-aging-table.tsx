"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AgingData {
  vendor: {
    id: number;
    name: string;
    category: string;
  };
  current: string;
  days1to30: string;
  days31to60: string;
  days61to90: string;
  over90: string;
  totalOutstanding: string;
}

interface APAgingTableProps {
  agingData: AgingData[];
}

export function APAgingTable({ agingData }: APAgingTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const toggleRow = (vendorId: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(vendorId)) {
      newExpanded.delete(vendorId);
    } else {
      newExpanded.add(vendorId);
    }
    setExpandedRows(newExpanded);
  };

  const calculateTotals = () => {
    return agingData.reduce(
      (acc, row) => ({
        current: acc.current + Number(row.current),
        days1to30: acc.days1to30 + Number(row.days1to30),
        days31to60: acc.days31to60 + Number(row.days31to60),
        days61to90: acc.days61to90 + Number(row.days61to90),
        over90: acc.over90 + Number(row.over90),
        totalOutstanding: acc.totalOutstanding + Number(row.totalOutstanding),
      }),
      {
        current: 0,
        days1to30: 0,
        days31to60: 0,
        days61to90: 0,
        over90: 0,
        totalOutstanding: 0,
      },
    );
  };

  const totals = calculateTotals();

  if (agingData.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">No outstanding bills found</p>
        <Button asChild>
          <Link href="/payables/bills/new">Create Your First Bill</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="p-4 border rounded-lg">
          <div className="text-sm font-medium text-muted-foreground">
            Total Outstanding
          </div>
          <div className="text-2xl font-bold">
            ${totals.totalOutstanding.toFixed(2)}
          </div>
        </div>
        <div className="p-4 border rounded-lg">
          <div className="text-sm font-medium text-muted-foreground">
            Current
          </div>
          <div className="text-2xl font-bold text-green-600">
            ${totals.current.toFixed(2)}
          </div>
        </div>
        <div className="p-4 border rounded-lg">
          <div className="text-sm font-medium text-muted-foreground">
            1-30 Days
          </div>
          <div className="text-2xl font-bold text-yellow-600">
            ${totals.days1to30.toFixed(2)}
          </div>
        </div>
        <div className="p-4 border rounded-lg">
          <div className="text-sm font-medium text-muted-foreground">
            Over 30 Days
          </div>
          <div className="text-2xl font-bold text-red-600">
            $
            {(totals.days31to60 + totals.days61to90 + totals.over90).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Aging Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Current</TableHead>
              <TableHead className="text-right">1-30 Days</TableHead>
              <TableHead className="text-right">31-60 Days</TableHead>
              <TableHead className="text-right">61-90 Days</TableHead>
              <TableHead className="text-right">90+ Days</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agingData.map((row) => (
              <React.Fragment key={row.vendor.id}>
                <TableRow>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-0 h-8 w-8"
                      onClick={() => toggleRow(row.vendor.id)}
                    >
                      {expandedRows.has(row.vendor.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/payables/vendors/${row.vendor.id}`}
                      className="font-medium hover:underline"
                    >
                      {row.vendor.name}
                    </Link>
                  </TableCell>
                  <TableCell>{row.vendor.category}</TableCell>
                  <TableCell className="text-right">
                    {Number(row.current) > 0 ? (
                      <span className="text-green-600">
                        ${Number(row.current).toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">$0.00</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {Number(row.days1to30) > 0 ? (
                      <span className="text-yellow-600">
                        ${Number(row.days1to30).toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">$0.00</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {Number(row.days31to60) > 0 ? (
                      <span className="text-orange-600">
                        ${Number(row.days31to60).toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">$0.00</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {Number(row.days61to90) > 0 ? (
                      <span className="text-red-600">
                        ${Number(row.days61to90).toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">$0.00</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {Number(row.over90) > 0 ? (
                      <span className="text-red-800 font-bold">
                        ${Number(row.over90).toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">$0.00</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    ${Number(row.totalOutstanding).toFixed(2)}
                  </TableCell>
                </TableRow>
                {expandedRows.has(row.vendor.id) && (
                  <TableRow>
                    <TableCell colSpan={9} className="bg-muted/50 p-4">
                      <div className="space-y-2">
                        <div className="font-medium text-sm">
                          Outstanding Bills:
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Click on vendor name to view detailed bills
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/payables/vendors/${row.vendor.id}`}>
                              View Vendor Details
                            </Link>
                          </Button>
                          <Button asChild size="sm" variant="outline">
                            <Link
                              href={`/payables/bills?vendorId=${row.vendor.id}`}
                            >
                              View Outstanding Bills
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
            {/* Totals Row */}
            <TableRow className="bg-muted font-bold">
              <TableCell colSpan={3}>Total</TableCell>
              <TableCell className="text-right">
                ${totals.current.toFixed(2)}
              </TableCell>
              <TableCell className="text-right">
                ${totals.days1to30.toFixed(2)}
              </TableCell>
              <TableCell className="text-right">
                ${totals.days31to60.toFixed(2)}
              </TableCell>
              <TableCell className="text-right">
                ${totals.days61to90.toFixed(2)}
              </TableCell>
              <TableCell className="text-right">
                ${totals.over90.toFixed(2)}
              </TableCell>
              <TableCell className="text-right">
                ${totals.totalOutstanding.toFixed(2)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-600" />
          <span>Current (not yet due)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-yellow-600" />
          <span>1-30 days overdue</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-orange-600" />
          <span>31-60 days overdue</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-600" />
          <span>61-90 days overdue</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-800" />
          <span>90+ days overdue</span>
        </div>
      </div>
    </div>
  );
}
