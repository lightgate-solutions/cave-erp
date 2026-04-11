"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2, Lock, Unlock } from "lucide-react";
import { toast } from "sonner";
import {
  getPeriods,
  createPeriod,
  updatePeriodStatus,
} from "@/actions/finance/gl/periods";
import { authClient } from "@/lib/auth-client";
import { format } from "date-fns";

interface Period {
  id: number;
  periodName: string;
  startDate: string;
  endDate: string;
  status: "Open" | "Closed" | "Locked";
  isYearEnd: boolean;
}

export default function GLPeriodsPage() {
  const { data: session } = authClient.useSession();
  const organizationId = session?.session?.activeOrganizationId;
  const [periods, setPeriods] = useState<Period[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    periodName: "",
    startDate: "",
    endDate: "",
  });
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusChangeContext, setStatusChangeContext] = useState<{
    id: number;
    periodName: string;
    nextStatus: "Open" | "Closed" | "Locked";
  } | null>(null);
  const [statusNote, setStatusNote] = useState("");

  const fetchPeriods = useCallback(async () => {
    if (!organizationId) return;
    setIsLoading(true);
    const result = await getPeriods(organizationId);
    if (result.success && result.data) {
      setPeriods(result.data as Period[]);
    } else {
      toast.error(result.error ?? "Failed to load periods");
    }
    setIsLoading(false);
  }, [organizationId]);

  useEffect(() => {
    fetchPeriods();
  }, [fetchPeriods]);

  const handleCreate = () => {
    if (!organizationId) {
      toast.error("Select an organization");
      return;
    }
    if (!formData.periodName || !formData.startDate || !formData.endDate) {
      toast.error("Fill in period name, start date, and end date");
      return;
    }
    startTransition(async () => {
      const result = await createPeriod({
        periodName: formData.periodName,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
      });
      if (result.success) {
        toast.success("Period created");
        setCreateOpen(false);
        setFormData({ periodName: "", startDate: "", endDate: "" });
        fetchPeriods();
      } else {
        toast.error(result.error);
      }
    });
  };

  const openStatusChangeDialog = (
    id: number,
    periodName: string,
    nextStatus: "Open" | "Closed" | "Locked",
  ) => {
    setStatusChangeContext({ id, periodName, nextStatus });
    setStatusNote("");
    setStatusDialogOpen(true);
  };

  const closeStatusChangeDialog = () => {
    setStatusDialogOpen(false);
    setStatusChangeContext(null);
    setStatusNote("");
  };

  const confirmStatusChange = () => {
    if (!statusChangeContext || !organizationId) return;

    const { id, nextStatus } = statusChangeContext;
    let reason: string | undefined;

    if (nextStatus === "Open") {
      const trimmed = statusNote.trim();
      if (!trimmed) {
        toast.error("A reason is required to reopen a period.");
        return;
      }
      reason = trimmed;
    } else {
      reason = statusNote.trim() || undefined;
    }

    startTransition(async () => {
      const result = await updatePeriodStatus(
        id,
        nextStatus,
        session?.user?.id,
        organizationId ?? undefined,
        reason,
      );
      if (result.success) {
        toast.success(`Period ${nextStatus.toLowerCase()}`);
        closeStatusChangeDialog();
        fetchPeriods();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fiscal Periods</h1>
          <p className="text-muted-foreground">
            {organizationId
              ? "Control when journal entries can be posted. Posting is allowed only in open periods."
              : "Select an organization to manage fiscal periods."}
          </p>
        </div>
        {organizationId ? (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> New Period
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create fiscal period</DialogTitle>
                <DialogDescription>
                  Add a period (e.g. month or quarter). Journals can only be
                  posted when their date falls in an open period.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="periodName">Period name</Label>
                  <Input
                    id="periodName"
                    placeholder="e.g. Jan 2026"
                    value={formData.periodName}
                    onChange={(e) =>
                      setFormData({ ...formData, periodName: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="startDate">Start date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="endDate">End date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={isPending}>
                  {isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ) : null}
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Start</TableHead>
              <TableHead>End</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!organizationId ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-muted-foreground"
                >
                  Choose an organization from the workspace switcher to load
                  fiscal periods.
                </TableCell>
              </TableRow>
            ) : isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : periods.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-muted-foreground"
                >
                  No periods defined. Create one to control posting by date, or
                  leave empty to allow posting anytime.
                </TableCell>
              </TableRow>
            ) : (
              periods.map((period) => (
                <TableRow key={period.id}>
                  <TableCell className="font-medium">
                    {period.periodName}
                    {period.isYearEnd && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        (Year end)
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {format(new Date(period.startDate), "PP")}
                  </TableCell>
                  <TableCell>
                    {format(new Date(period.endDate), "PP")}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        period.status === "Open"
                          ? "bg-green-100 text-green-700"
                          : period.status === "Closed"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {period.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {period.status === "Open" ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          openStatusChangeDialog(
                            period.id,
                            period.periodName,
                            "Closed",
                          )
                        }
                        disabled={isPending}
                      >
                        <Lock className="h-4 w-4 mr-1" /> Close
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          openStatusChangeDialog(
                            period.id,
                            period.periodName,
                            "Open",
                          )
                        }
                        disabled={isPending}
                      >
                        <Unlock className="h-4 w-4 mr-1" /> Reopen
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={statusDialogOpen}
        onOpenChange={(open) => {
          if (!open) closeStatusChangeDialog();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {statusChangeContext?.nextStatus === "Open"
                ? "Reopen period"
                : statusChangeContext?.nextStatus === "Closed"
                  ? "Close period"
                  : "Change period status"}
            </DialogTitle>
            <DialogDescription>
              {statusChangeContext?.nextStatus === "Open" ? (
                <>
                  Reason for reopening{" "}
                  <span className="font-medium text-foreground">
                    {statusChangeContext.periodName}
                  </span>{" "}
                  (required for the audit trail).
                </>
              ) : (
                <>
                  Optional note for this status change (stored for audit) when
                  closing{" "}
                  <span className="font-medium text-foreground">
                    {statusChangeContext?.periodName}
                  </span>
                  .
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-2">
            <Label htmlFor="status-change-note">
              {statusChangeContext?.nextStatus === "Open"
                ? "Reason"
                : "Note (optional)"}
            </Label>
            <Textarea
              id="status-change-note"
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              placeholder={
                statusChangeContext?.nextStatus === "Open"
                  ? "e.g. Management approval for late adjustment entries"
                  : "e.g. Month-end close completed — no further postings"
              }
              rows={4}
              className="min-h-[100px] resize-y"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={closeStatusChangeDialog}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={confirmStatusChange}
              disabled={isPending}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
