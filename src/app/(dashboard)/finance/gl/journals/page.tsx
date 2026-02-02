"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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
import { Plus, Loader2, MoreHorizontal } from "lucide-react";
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
  const organizationId = session?.session.activeOrganizationId;
  const [journals, setJournals] = useState<Journal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [journalToDelete, setJournalToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
      if (!organizationId) return;
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
            View and manage your General Ledger transactions.
          </p>
        </div>
        <Button asChild>
          <Link href="/finance/gl/journals/new">
            <Plus className="mr-2 h-4 w-4" /> New Journal
          </Link>
        </Button>
      </div>

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
            {isLoading ? (
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
            ) : (
              journals.map((journal) => (
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
