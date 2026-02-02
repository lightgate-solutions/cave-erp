"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, Pencil, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { getJournalById, postJournal } from "@/actions/finance/gl/journals";
import Link from "next/link";
import { format } from "date-fns";
import { authClient } from "@/lib/auth-client";
import { Badge } from "@/components/ui/badge";

interface JournalLine {
  id: number;
  description: string | null;
  debit: string;
  credit: string;
  account: {
    code: string;
    name: string;
  };
}

interface Journal {
  id: number;
  journalNumber: string;
  transactionDate: string;
  description: string;
  reference: string | null;
  status: "Draft" | "Posted" | "Voided";
  source: string;
  totalDebits: string;
  totalCredits: string;
  createdByUser?: { name: string } | null;
  postedByUser?: { name: string } | null;
  lines: JournalLine[];
}

export default function ViewJournalPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const organizationId = session?.session.activeOrganizationId;
  const userId = session?.user?.id;
  const [journal, setJournal] = useState<Journal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    async function load() {
      if (!organizationId || !params.id) return;
      setIsLoading(true);
      const res = await getJournalById(Number(params.id), organizationId);
      if (res.success && res.data) {
        // @ts-ignore
        setJournal(res.data);
      } else {
        toast.error(res.error || "Failed to load journal");
        router.push("/finance/gl/journals");
      }
      setIsLoading(false);
    }
    load();
  }, [organizationId, params.id, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  async function handlePost() {
    if (!journal || !userId || !organizationId) return;
    setIsPosting(true);
    const result = await postJournal(journal.id, userId);
    if (result.success) {
      toast.success("Journal posted successfully");
      const res = await getJournalById(journal.id, organizationId);
      if (res.success && res.data) setJournal(res.data);
    } else {
      toast.error(result.error);
    }
    setIsPosting(false);
  }

  if (!journal) return null;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/finance/gl/journals">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Journal {journal.journalNumber}
            </h1>
            <p className="text-muted-foreground">View journal entry details.</p>
          </div>
        </div>
        <div className="flex gap-2">
          {journal.status === "Draft" && (
            <>
              <Button onClick={handlePost} disabled={isPosting}>
                {isPosting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <CheckCircle className="mr-2 h-4 w-4" /> Post Journal
              </Button>
              <Button asChild variant="outline">
                <Link href={`/finance/gl/journals/${journal.id}/edit`}>
                  <Pencil className="mr-2 h-4 w-4" /> Edit
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div>
          <span className="text-sm font-medium text-muted-foreground">
            Date
          </span>
          <p className="text-lg font-medium">
            {format(new Date(journal.transactionDate), "PP")}
          </p>
        </div>
        <div>
          <span className="text-sm font-medium text-muted-foreground">
            Reference
          </span>
          <p className="text-lg">{journal.reference || "-"}</p>
        </div>
        <div>
          <span className="text-sm font-medium text-muted-foreground">
            Status
          </span>
          <div className="mt-1">
            <Badge
              variant={journal.status === "Posted" ? "default" : "secondary"}
              className={
                journal.status === "Posted"
                  ? "bg-green-100 text-green-700 hover:bg-green-100"
                  : ""
              }
            >
              {journal.status}
            </Badge>
          </div>
        </div>
        <div>
          <span className="text-sm font-medium text-muted-foreground">
            Posted By
          </span>
          <p className="text-lg">{journal.postedByUser?.name || "-"}</p>
        </div>
        <div className="col-span-4">
          <span className="text-sm font-medium text-muted-foreground">
            Description
          </span>
          <p className="text-lg">{journal.description}</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Journal Lines</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Account</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-[150px] text-right">Debit</TableHead>
                <TableHead className="w-[150px] text-right">Credit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {journal.lines.map((line) => (
                <TableRow key={line.id}>
                  <TableCell>
                    <div className="font-medium">{line.account.code}</div>
                    <div className="text-sm text-muted-foreground">
                      {line.account.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    {line.description || journal.description}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {Number(line.debit) > 0
                      ? Number(line.debit).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {Number(line.credit) > 0
                      ? Number(line.credit).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })
                      : "-"}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/50 font-medium">
                <TableCell colSpan={2} className="text-right">
                  Totals
                </TableCell>
                <TableCell className="text-right text-primary">
                  {Number(journal.totalDebits).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}
                </TableCell>
                <TableCell className="text-right text-primary">
                  {Number(journal.totalCredits).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
