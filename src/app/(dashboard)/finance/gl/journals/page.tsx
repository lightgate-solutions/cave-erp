"use client";

import { useState, useEffect, useMemo } from "react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Loader2, MoreHorizontal, Search } from "lucide-react";
import Link from "next/link";
import { getJournals, deleteJournal } from "@/actions/finance/gl/journals";
import { format } from "date-fns";
import { authClient } from "@/lib/auth-client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const PAGE_SIZE = 10;

// Mock types
interface Journal {
  id: number;
  journalNumber: string;
  transactionDate: string;
  description: string;
  totalDebits: string;
  status: string;
  source: string;
  createdByUser?: { name: string } | null;
  postedByUser?: { name: string } | null;
}

export default function JournalsPage() {
  const { data: session } = authClient.useSession();
  const organizationId = session?.session?.activeOrganizationId;
  const [journals, setJournals] = useState<Journal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [journalToDelete, setJournalToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredJournals = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return journals;

    return journals.filter((j) => {
      const dateStr = format(new Date(j.transactionDate), "PP").toLowerCase();
      const amountStr = Number(j.totalDebits).toLocaleString("en-US", {
        minimumFractionDigits: 2,
      });
      const posted = j.postedByUser?.name?.toLowerCase() ?? "";
      const haystack = [
        j.journalNumber,
        j.description,
        j.source,
        j.status,
        dateStr,
        amountStr,
        posted,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [journals, searchTerm]);

  const totalFiltered = filteredJournals.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE));
  const displayPage = Math.min(page, totalPages);

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

  const paginatedJournals = useMemo(() => {
    const start = (displayPage - 1) * PAGE_SIZE;
    return filteredJournals.slice(start, start + PAGE_SIZE);
  }, [filteredJournals, displayPage]);

  async function handleDelete() {
    if (!journalToDelete || !organizationId) return;
    setIsDeleting(true);
    const result = await deleteJournal(journalToDelete, organizationId);
    if (result.success) {
      toast.success("Journal deleted successfully");
      setJournals(journals.filter((j) => j.id !== journalToDelete));
    } else {
      toast.error(result.error);
    }
    setIsDeleting(false);
    setJournalToDelete(null);
  }

  useEffect(() => {
    async function load() {
      if (!organizationId) {
        setJournals([]);
        setIsLoading(false);
        return;
      }
      setPage(1);
      setIsLoading(true);
      const res = await getJournals(organizationId);
      if (res.success && res.data) {
        // @ts-ignore
        setJournals(res.data);
      }
      setIsLoading(false);
    }
    load();
  }, [organizationId]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Journal Entries</h1>
          <p className="text-muted-foreground">
            {organizationId
              ? "View and manage your General Ledger transactions."
              : "Select an organization to view journal entries."}
          </p>
        </div>
        {organizationId ? (
          <Button asChild>
            <Link href="/finance/gl/journals/new">
              <Plus className="mr-2 h-4 w-4" /> New Journal
            </Link>
          </Button>
        ) : null}
      </div>

      {organizationId ? (
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by number, description, source, status, amount, date…"
            className="pl-8"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            aria-label="Search journal entries"
          />
        </div>
      ) : null}

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Number</TableHead>
              <TableHead className="w-[400px]">Description</TableHead>
              <TableHead>Source</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Posted By</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!organizationId ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-24 text-center text-muted-foreground"
                >
                  Choose an organization from the workspace switcher to load
                  journals.
                </TableCell>
              </TableRow>
            ) : isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : journals.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-24 text-center text-muted-foreground"
                >
                  No journals found.
                </TableCell>
              </TableRow>
            ) : filteredJournals.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-24 text-center text-muted-foreground"
                >
                  No journal entries match your search.
                </TableCell>
              </TableRow>
            ) : (
              paginatedJournals.map((journal) => (
                <TableRow key={journal.id}>
                  <TableCell>
                    {format(new Date(journal.transactionDate), "PP")}
                  </TableCell>
                  <TableCell className="font-medium">
                    {journal.journalNumber}
                  </TableCell>
                  <TableCell>{journal.description}</TableCell>
                  <TableCell>{journal.source}</TableCell>
                  <TableCell className="text-right font-mono">
                    {Number(journal.totalDebits).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        journal.status === "Posted"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {journal.status}
                    </span>
                  </TableCell>
                  <TableCell>{journal.postedByUser?.name || "-"}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link href={`/finance/gl/journals/${journal.id}`}>
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        {journal.status === "Draft" && (
                          <>
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/finance/gl/journals/${journal.id}/edit`}
                              >
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => setJournalToDelete(journal.id)}
                            >
                              Delete
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {organizationId &&
      !isLoading &&
      journals.length > 0 &&
      totalFiltered > 0 ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {totalFiltered > 0 ? (displayPage - 1) * PAGE_SIZE + 1 : 0}–
            {Math.min(displayPage * PAGE_SIZE, totalFiltered)} of{" "}
            {totalFiltered} {totalFiltered === 1 ? "entry" : "entries"}
            {searchTerm.trim() ? " (filtered)" : ""}
          </p>
          {totalPages > 1 ? (
            <Pagination className="mx-0 w-full justify-end sm:w-auto">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className={
                      displayPage === 1
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
                          onClick={() => setPage(p)}
                          isActive={p === displayPage}
                        >
                          {p}
                        </PaginationLink>
                      </PaginationItem>
                    </div>
                  ))}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className={
                      displayPage === totalPages
                        ? "pointer-events-none opacity-50"
                        : undefined
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          ) : null}
        </div>
      ) : null}

      <AlertDialog
        open={!!journalToDelete}
        onOpenChange={(open) => !open && setJournalToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              journal entry and remove the data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
