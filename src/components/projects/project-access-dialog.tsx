"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Shield, Trash2, UserPlus, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  getProjectTeamMembers,
  addTeamMember as addTeamMemberAction,
  updateTeamMemberPermission as updatePermissionAction,
  removeTeamMember as removeTeamMemberAction,
  updateProjectSupervisor as updateSupervisorAction,
} from "@/actions/projects/access";

type TeamMember = {
  id: number;
  userId: string;
  name: string | null;
  email: string;
  accessLevel: "read" | "write";
  grantedBy: string | null;
  createdAt: Date;
};

type Employee = { id: string; name: string; email: string };

type Props = {
  trigger: React.ReactNode;
  projectId: number;
  projectName: string;
  currentSupervisorId: string | null;
};

export function ProjectAccessDialog({
  trigger,
  projectId,
  projectName,
  currentSupervisorId,
}: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [supervisors, setSupervisors] = useState<Employee[]>([]);

  // Add team member state
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [selectedAccessLevel, setSelectedAccessLevel] = useState<
    "read" | "write"
  >("read");
  const [adding, setAdding] = useState(false);

  // Supervisor state
  const [supervisorId, setSupervisorId] = useState<string>(
    currentSupervisorId || "",
  );
  const [updatingSupervisor, setUpdatingSupervisor] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Load team members
      const members = await getProjectTeamMembers(projectId);
      setTeamMembers(members);

      // Load employees and supervisors
      const [employeesRes, supervisorsRes] = await Promise.all([
        fetch("/api/hr/employees/all"),
        fetch("/api/hr/employees/supervisors"),
      ]);

      const employeesData = await employeesRes.json();
      const supervisorsData = await supervisorsRes.json();

      setEmployees(employeesData.employees ?? []);
      setSupervisors(supervisorsData.supervisors ?? []);
    } catch (error) {
      toast.error("Failed to load team data");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open, loadData]);

  async function handleAddTeamMember() {
    if (!selectedEmployee) return;

    setAdding(true);
    try {
      const result = await addTeamMemberAction(
        projectId,
        selectedEmployee,
        selectedAccessLevel,
      );

      if (result.success) {
        toast.success("Team member added successfully");
        setSelectedEmployee("");
        setSelectedAccessLevel("read");
        await loadData(); // Refresh list
      } else {
        toast.error(result.error || "Failed to add team member");
      }
    } catch (error) {
      toast.error("Failed to add team member");
    } finally {
      setAdding(false);
    }
  }

  async function handleUpdatePermission(
    userId: string,
    accessLevel: "read" | "write",
  ) {
    try {
      const result = await updatePermissionAction(
        projectId,
        userId,
        accessLevel,
      );

      if (result.success) {
        toast.success("Permission updated successfully");
        await loadData(); // Refresh list
      } else {
        toast.error(result.error || "Failed to update permission");
      }
    } catch (error) {
      toast.error("Failed to update permission");
    }
  }

  async function handleRemoveTeamMember(userId: string) {
    try {
      const result = await removeTeamMemberAction(projectId, userId);

      if (result.success) {
        toast.success("Team member removed successfully");
        await loadData(); // Refresh list
      } else {
        toast.error(result.error || "Failed to remove team member");
      }
    } catch (error) {
      toast.error("Failed to remove team member");
    }
  }

  async function handleUpdateSupervisor() {
    if (!supervisorId || supervisorId === currentSupervisorId) return;

    setUpdatingSupervisor(true);
    try {
      const result = await updateSupervisorAction(projectId, supervisorId);

      if (result.success) {
        toast.success("Supervisor updated successfully");
        // Refresh parent component
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("projects:changed"));
        }
      } else {
        toast.error(result.error || "Failed to update supervisor");
        // Revert on error
        setSupervisorId(currentSupervisorId || "");
      }
    } catch (error) {
      toast.error("Failed to update supervisor");
      setSupervisorId(currentSupervisorId || "");
    } finally {
      setUpdatingSupervisor(false);
    }
  }

  // Filter out employees who are already team members or the supervisor
  const availableEmployees = employees.filter(
    (e) =>
      e.id !== supervisorId && !teamMembers.some((tm) => tm.userId === e.id),
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Manage Project Access</DialogTitle>
          <DialogDescription>
            Manage team member access and permissions for "{projectName}"
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Supervisor Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <Label>Project Supervisor</Label>
              </div>
              <div className="flex gap-2">
                <Select
                  value={supervisorId}
                  onValueChange={(v) => setSupervisorId(v)}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select supervisor" />
                  </SelectTrigger>
                  <SelectContent>
                    {supervisors.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} ({s.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleUpdateSupervisor}
                  disabled={
                    updatingSupervisor ||
                    !supervisorId ||
                    supervisorId === currentSupervisorId
                  }
                  variant="secondary"
                >
                  {updatingSupervisor ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Update"
                  )}
                </Button>
              </div>
            </div>

            {/* Add Team Member Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-muted-foreground" />
                <Label>Add Team Member</Label>
              </div>
              <div className="flex gap-2">
                <Select
                  value={selectedEmployee}
                  onValueChange={(v) => setSelectedEmployee(v)}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableEmployees.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
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
                  onClick={handleAddTeamMember}
                  disabled={adding || !selectedEmployee}
                  variant="secondary"
                >
                  {adding ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Add"
                  )}
                </Button>
              </div>
            </div>

            {/* Team Members List */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <Label>Team Members ({teamMembers.length})</Label>
              </div>

              {teamMembers.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground border rounded-md">
                  No team members yet. Add team members above.
                </div>
              ) : (
                <ScrollArea className="h-64 w-full rounded-md border">
                  <div className="p-4 space-y-3">
                    {teamMembers.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">
                            {member.name || "Unknown"}
                          </div>
                          <div className="text-sm text-muted-foreground truncate">
                            {member.email}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Select
                            value={member.accessLevel}
                            onValueChange={(v) =>
                              handleUpdatePermission(
                                member.userId,
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
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              handleRemoveTeamMember(member.userId)
                            }
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>

            {/* Permission Legend */}
            <div className="text-sm text-muted-foreground space-y-1 bg-muted p-3 rounded-md">
              <div className="font-medium mb-2">Permission Levels:</div>
              <div>
                <Badge variant="secondary" className="mr-2">
                  Read
                </Badge>
                Can view project, milestones, and expenses
              </div>
              <div>
                <Badge variant="secondary" className="mr-2">
                  Read-Write
                </Badge>
                Can view and edit milestones and expenses
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button onClick={() => setOpen(false)} variant="outline">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
