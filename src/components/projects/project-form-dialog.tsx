/** biome-ignore-all lint/suspicious/noArrayIndexKey: <> */
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { X } from "lucide-react";

type Supervisor = { id: number; name: string; email: string; authId: string };
type Employee = { id: number; name: string; email: string; authId: string };
type TeamMember = {
  userId: string;
  name: string;
  email: string;
  accessLevel: "read" | "write";
};

type Props = {
  trigger: React.ReactNode;
  initial?: {
    id: number;
    name: string;
    code: string;
    description: string | null;
    location: string | null;
    supervisorId: string | null; // This is authId (text) from database
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
  const [budgetPlanned, setBudgetPlanned] = useState<string>(
    initial?.budgetPlanned ? String(initial.budgetPlanned) : "0",
  );
  const [budgetActual, setBudgetActual] = useState<string>(
    initial?.budgetActual ? String(initial.budgetActual) : "0",
  );
  const [supervisorId, setSupervisorId] = useState<string>(
    initial?.supervisorId ?? "",
  );
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string>(initial?.status ?? "pending");

  // Team member selection state
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [selectedAccessLevel, setSelectedAccessLevel] = useState<
    "read" | "write"
  >("read");

  useEffect(() => {
    if (!open) return;
    (async () => {
      // Fetch supervisors
      const supervisorsRes = await fetch("/api/hr/employees/supervisors");
      const supervisorsData = await supervisorsRes.json();
      setSupervisors(supervisorsData.supervisors ?? []);

      // Fetch all employees for team member selection (only for create)
      if (!initial?.id) {
        const employeesRes = await fetch("/api/hr/employees/all");
        const employeesData = await employeesRes.json();
        setEmployees(employeesData.employees ?? []);
      }
    })();
  }, [open, initial?.id]);

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? "");
    setDescription(initial?.description ?? "");
    setLocation(initial?.location ?? "");
    setSupervisorId(initial?.supervisorId ?? "");
    setBudgetPlanned(
      initial?.budgetPlanned ? String(initial.budgetPlanned) : "0",
    );
    setBudgetActual(initial?.budgetActual ? String(initial.budgetActual) : "0");
    setStatus(initial?.status ?? "pending");
    setTeamMembers([]); // Reset team members on dialog open
  }, [initial, open]);

  function addTeamMember() {
    if (!selectedEmployee) return;

    const employee = employees.find((e) => e.authId === selectedEmployee);
    if (!employee) return;

    // Check if already added
    if (teamMembers.some((tm) => tm.userId === selectedEmployee)) {
      toast.error("This team member has already been added");
      return;
    }

    // Don't allow adding supervisor as team member
    if (selectedEmployee === supervisorId) {
      toast.error("Supervisor is automatically added to the project");
      return;
    }

    setTeamMembers([
      ...teamMembers,
      {
        userId: selectedEmployee,
        name: employee.name,
        email: employee.email,
        accessLevel: selectedAccessLevel,
      },
    ]);

    setSelectedEmployee("");
    setSelectedAccessLevel("read");
  }

  function removeTeamMember(userId: string) {
    setTeamMembers(teamMembers.filter((tm) => tm.userId !== userId));
  }

  function updateTeamMemberPermission(
    userId: string,
    accessLevel: "read" | "write",
  ) {
    setTeamMembers(
      teamMembers.map((tm) =>
        tm.userId === userId ? { ...tm, accessLevel } : tm,
      ),
    );
  }

  async function onSubmit() {
    // Validate required supervisor (only for create, not edit)
    if (!initial?.id && !supervisorId) {
      toast.error("Supervisor is required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name,
        description: description || null,
        location: location || null,
        supervisorId: supervisorId || null,
        budgetPlanned: Number(budgetPlanned) || 0,
        budgetActual: Number(budgetActual) || 0,
        status,
        // Only include teamMembers for create, not edit
        ...(!initial?.id &&
          teamMembers.length > 0 && {
            teamMembers: teamMembers.map((tm) => ({
              userId: tm.userId,
              accessLevel: tm.accessLevel,
            })),
          }),
      };

      let res: Response;
      if (initial?.id) {
        res = await fetch(`/api/projects/${initial.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`/api/projects`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();

      if (!res.ok) {
        if (data.error?.includes("Project limit reached")) {
          toast.error(data.error, {
            description: "Please upgrade your plan to create more projects.",
            action: {
              label: "Upgrade",
              onClick: () => {
                window.location.href = "/settings/billing";
              },
            },
            duration: 10000,
          });
        }

        toast.error(data.error || "Something went wrong");
        return;
      }

      toast.success(initial?.id ? "Project updated" : "Project created");
      setOpen(false);
      onCompleted?.();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("projects:changed"));
      }
    } catch (_error) {
      toast.error("Failed to save project");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
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
            <Label>
              Supervisor{" "}
              {!initial?.id && <span className="text-red-500">*</span>}
            </Label>
            <Select
              value={supervisorId}
              onValueChange={(v) => setSupervisorId(v)}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    initial?.id
                      ? "Select a supervisor (optional)"
                      : "Select a supervisor (required)"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {supervisors.map((s) => (
                  <SelectItem key={s.id} value={s.authId}>
                    {s.name} ({s.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Team Member Selection - Only show for create, not edit */}
          {!initial?.id && (
            <div className="grid gap-2">
              <Label>Team Members (optional)</Label>
              <p className="text-sm text-muted-foreground">
                Add team members with Read or Read-Write permissions
              </p>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Select
                    value={selectedEmployee}
                    onValueChange={(v) => setSelectedEmployee(v)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select team member" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees
                        .filter((e) => e.authId !== supervisorId)
                        .map((e, idx) => (
                          <SelectItem key={idx} value={e.authId}>
                            {e.name} ({e.email})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={selectedAccessLevel}
                    onValueChange={(v) =>
                      setSelectedAccessLevel(v as "read" | "write")
                    }
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="read">Read</SelectItem>
                      <SelectItem value="write">Read-Write</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={addTeamMember}
                    disabled={!selectedEmployee}
                  >
                    Add
                  </Button>
                </div>

                {/* Team members list */}
                {teamMembers.length > 0 && (
                  <ScrollArea className="h-32 w-full rounded-md border p-2">
                    <div className="space-y-2">
                      {teamMembers.map((tm) => (
                        <div
                          key={tm.userId}
                          className="flex items-center justify-between gap-2 rounded-md bg-muted p-2"
                        >
                          <div className="flex-1 text-sm">
                            <span className="font-medium">{tm.name}</span>
                            <span className="text-muted-foreground ml-2">
                              ({tm.email})
                            </span>
                          </div>
                          <Select
                            value={tm.accessLevel}
                            onValueChange={(v) =>
                              updateTeamMemberPermission(
                                tm.userId,
                                v as "read" | "write",
                              )
                            }
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="read">Read</SelectItem>
                              <SelectItem value="write">Read-Write</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTeamMember(tm.userId)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </div>
          )}

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
