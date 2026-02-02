"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateJournal, getJournalById } from "@/actions/finance/gl/journals";
import { getChartOfAccounts } from "@/actions/finance/gl/accounts";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

interface Account {
  id: number;
  code: string;
  name: string;
}

interface JournalLine {
  id: number; // local temp id
  accountId: string;
  description: string;
  debit: string;
  credit: string;
}

export default function EditJournalPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = authClient.useSession();
  const organizationId = session?.session.activeOrganizationId;

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Header State
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [reference, setReference] = useState("");
  const [journalNumber, setJournalNumber] = useState("");

  // Lines State
  const [lines, setLines] = useState<JournalLine[]>([]);

  // 1. Fetch Accounts
  useEffect(() => {
    if (organizationId) {
      getChartOfAccounts(organizationId).then((res) => {
        if (res.success && res.data) {
          // @ts-ignore
          setAccounts(res.data);
        }
      });
    }
  }, [organizationId]);

  // 2. Fetch Journal Data
  useEffect(() => {
    async function load() {
      if (!organizationId || !params.id) return;

      const res = await getJournalById(Number(params.id), organizationId);
      if (res.success && res.data) {
        const j = res.data;
        setJournalNumber(j.journalNumber);
        setDate(j.transactionDate); // assuming yyyy-mm-dd from API/DB
        setDescription(j.description);
        setReference(j.reference || "");

        // Map lines (DB returns debit/credit as string)
        type LineRow = {
          accountId: number;
          description: string | null;
          debit: string;
          credit: string;
        };
        const loadedLines = (j.lines as LineRow[]).map((l) => ({
          id: Math.random(), // generate new temp IDs for UI handling
          accountId: String(l.accountId),
          description: l.description || "",
          debit: l.debit,
          credit: l.credit,
        }));
        setLines(loadedLines);
      } else {
        toast.error("Failed to load journal");
        router.push("/finance/gl/journals");
      }
      setIsLoading(false);
    }
    load();
  }, [organizationId, params.id, router]);

  const addLine = () => {
    setLines([
      ...lines,
      {
        id: Math.random(),
        accountId: "",
        description: "",
        debit: "0.00",
        credit: "0.00",
      },
    ]);
  };

  const removeLine = (id: number) => {
    if (lines.length <= 2) {
      toast.error("Journal must have at least 2 lines");
      return;
    }
    setLines(lines.filter((l) => l.id !== id));
  };

  const updateLine = (id: number, updates: Partial<JournalLine>) => {
    setLines((prevLines) =>
      prevLines.map((l) => (l.id === id ? { ...l, ...updates } : l)),
    );
  };

  const totalDebits = lines.reduce(
    (sum, line) => sum + (parseFloat(line.debit) || 0),
    0,
  );
  const totalCredits = lines.reduce(
    (sum, line) => sum + (parseFloat(line.credit) || 0),
    0,
  );
  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

  const handleSubmit = () => {
    if (!organizationId) {
      toast.error("Organization not found");
      return;
    }
    if (!description) {
      toast.error("Description is required");
      return;
    }
    if (lines.some((l) => !l.accountId)) {
      toast.error("All lines must have an account selected");
      return;
    }

    startTransition(async () => {
      const payloadLines = lines.map((line) => ({
        accountId: parseInt(line.accountId),
        description: line.description || description,
        debit: parseFloat(line.debit) || 0,
        credit: parseFloat(line.credit) || 0,
      }));

      const result = await updateJournal(Number(params.id), {
        organizationId,
        transactionDate: new Date(date),
        postingDate: new Date(date),
        description,
        reference,
        source: "Manual",
        status: "Posted",
        lines: payloadLines,
      });

      if (result.success) {
        toast.success(`Journal ${journalNumber} updated`);
        router.push("/finance/gl/journals");
      } else {
        toast.error(result.error);
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/finance/gl/journals">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Edit Journal Entry
          </h1>
          <p className="text-muted-foreground">
            Modify journal transaction {journalNumber}.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label>Date</Label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Reference</Label>
          <Input
            placeholder="#REF"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Journal #</Label>
          <Input disabled value={journalNumber} />
        </div>
        <div className="col-span-3 space-y-2">
          <Label>Description</Label>
          <Input
            placeholder="e.g. Monthly Depreciation"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
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
                <TableHead>Description (Optional)</TableHead>
                <TableHead className="w-[150px] text-right">Debit</TableHead>
                <TableHead className="w-[150px] text-right">Credit</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.map((line) => (
                <TableRow key={line.id}>
                  <TableCell>
                    <Select
                      value={line.accountId}
                      onValueChange={(val) =>
                        updateLine(line.id, { accountId: val })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Account" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((acc) => (
                          <SelectItem key={acc.id} value={String(acc.id)}>
                            {acc.code} - {acc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      value={line.description}
                      onChange={(e) =>
                        updateLine(line.id, { description: e.target.value })
                      }
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.01"
                      className="h-8 text-right"
                      value={line.debit}
                      onKeyDown={(e) => {
                        if (["e", "E", "+"].includes(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (parseFloat(val) !== 0) {
                          updateLine(line.id, { debit: val, credit: "0.00" });
                        } else {
                          updateLine(line.id, { debit: val });
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      className="h-8 text-right"
                      value={line.credit}
                      onKeyDown={(e) => {
                        if (["e", "E", "+", "-"].includes(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (parseFloat(val) !== 0) {
                          updateLine(line.id, { credit: val, debit: "0.00" });
                        } else {
                          updateLine(line.id, { credit: val });
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLine(line.id)}
                      className="h-8 w-8 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="p-4 flex justify-between items-center bg-gray-50 border-t">
            <Button variant="outline" size="sm" onClick={addLine}>
              <Plus className="mr-2 h-4 w-4" /> Add Line
            </Button>
            <div className="flex gap-8 text-sm font-medium">
              <div className={!isBalanced ? "text-red-600" : ""}>
                Total Debits: {totalDebits.toFixed(2)}
              </div>
              <div className={!isBalanced ? "text-red-600" : ""}>
                Total Credits: {totalCredits.toFixed(2)}
              </div>
              <div
                className={
                  !isBalanced
                    ? "text-red-600 font-bold"
                    : "text-green-600 font-bold"
                }
              >
                Difference: {(totalDebits - totalCredits).toFixed(2)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button variant="outline" asChild>
          <Link href="/finance/gl/journals">Cancel</Link>
        </Button>
        <Button onClick={handleSubmit} disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Update Journal
        </Button>
      </div>
    </div>
  );
}
