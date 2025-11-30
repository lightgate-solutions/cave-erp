"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Supervisor = { id: number; name: string; email: string };

type Props = {
  trigger: React.ReactNode;
  initial?: {
    id: number;
    name: string;
    code: string;
    description: string | null;
    location: string | null;
    supervisorId: number | null;
    status?: string;
    budgetPlanned?: number;
    budgetActual?: number;
  } | null;
  onCompleted?: () => void;
};

export function ProjectFormDialog({ trigger, initial, onCompleted }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [budgetPlanned, setBudgetPlanned] = useState<string>("0");
  const [budgetActual, setBudgetActual] = useState<string>("0");
  const [supervisorId, setSupervisorId] = useState<string>(
    initial?.supervisorId ? String(initial.supervisorId) : "",
  );
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string>(
    initial ? (initial.status ?? "pending") : "pending",
  );

  useEffect(() => {
    if (!open) return;
    (async () => {
      const res = await fetch("/api/hr/employees/supervisors");
      const data = await res.json();
      setSupervisors(data.supervisors ?? []);
    })();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? "");
    setDescription(initial?.description ?? "");
    setLocation(initial?.location ?? "");
    setSupervisorId(initial?.supervisorId ? String(initial.supervisorId) : "");
    setBudgetPlanned(
      initial?.budgetPlanned ? String(initial.budgetPlanned) : "0",
    );
    setBudgetActual(initial?.budgetActual ? String(initial.budgetActual) : "0");
    setStatus(initial?.status ?? "pending");
  }, [initial, open]);

  async function onSubmit() {
    setSaving(true);
    try {
      const payload = {
        name,
        description: description || null,
        location: location || null,
        supervisorId: supervisorId ? Number(supervisorId) : null,
        budgetPlanned: Number(budgetPlanned) || 0,
        budgetActual: Number(budgetActual) || 0,
        status,
      };
      if (initial?.id) {
        await fetch(`/api/projects/${initial.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await fetch(`/api/projects`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      setOpen(false);
      onCompleted?.();
      // Notify dashboards/cards to refresh
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("projects:changed"));
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {initial?.id ? "Edit Project" : "New Project"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          {/* Code is auto-generated server-side (e.g., 1BM, 2BM). */}
          <div className="grid gap-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={location ?? ""}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description ?? ""}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Supervisor</Label>
            <Select
              value={supervisorId}
              onValueChange={(v) => setSupervisorId(v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a supervisor (optional)" />
              </SelectTrigger>
              <SelectContent>
                {supervisors.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name} ({s.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="budgetPlanned">Budget (planned)</Label>
              <Input
                id="budgetPlanned"
                type="number"
                value={budgetPlanned}
                onChange={(e) => setBudgetPlanned(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="budgetActual">Budget (actual)</Label>
              <Input
                id="budgetActual"
                type="number"
                value={budgetActual}
                onChange={(e) => setBudgetActual(e.target.value)}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onSubmit} disabled={saving}>
            {initial?.id ? "Save changes" : "Create project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
