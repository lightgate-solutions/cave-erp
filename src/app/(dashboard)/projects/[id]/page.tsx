"use client";

import {
  useEffect,
  useMemo,
  useState,
  useCallback,
  use as usePromise,
} from "react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { Calendar, ChevronLeft, Loader2, Receipt } from "lucide-react";
import { ProjectHeader } from "@/components/projects/project-header";

type Milestone = {
  id: number;
  projectId: number;
  title: string;
  description: string | null;
  dueDate: string | null;
  completed: number;
};

type Project = {
  id: number;
  name: string;
  code: string;
  description: string | null;
  location: string | null;
  status: string;
  budgetPlanned: number;
  budgetActual: number;
  supervisorId: number | null;
  supervisorName: string | null;
  supervisorEmail: string | null;
  createdAt: string;
  updatedAt: string;
};

type Expense = {
  id: number;
  projectId: number;
  title: string;
  amount: number;
  spentAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = usePromise(params);
  const projectId = Number(id);
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(
    null,
  );

  const load = useCallback(async () => {
    setLoading(true);
    const [pRes, mRes, eRes] = await Promise.all([
      fetch(`/api/projects/${projectId}`),
      fetch(`/api/projects/${projectId}/milestones`),
      fetch(`/api/projects/${projectId}/expenses`),
    ]);
    const p = await pRes.json();
    const m = await mRes.json();
    const e = await eRes.json();
    setProject(p.project);
    setMilestones(m.milestones ?? []);
    setExpenses(e.expenses ?? []);
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  const progress = useMemo(() => {
    if (!milestones.length) return 0;
    const completed = milestones.filter((m) => m.completed).length;
    return Math.round((completed / milestones.length) * 100);
  }, [milestones]);

  const spent = useMemo(
    () => expenses.reduce((acc, it) => acc + (it.amount ?? 0), 0),
    [expenses],
  );
  const remaining = useMemo(
    () => (project?.budgetPlanned ?? 0) - spent,
    [project, spent],
  );

  async function saveMilestone() {
    if (editingMilestone?.id) {
      await fetch(`/api/projects/${projectId}/milestones`, {
        method: "PUT",
        body: JSON.stringify({
          id: editingMilestone.id,
          title,
          description,
          dueDate,
        }),
      });
    } else {
      await fetch(`/api/projects/${projectId}/milestones`, {
        method: "POST",
        body: JSON.stringify({ title, description, dueDate }),
      });
    }
    setTitle("");
    setDescription("");
    setDueDate("");
    setEditingMilestone(null);
    setOpen(false);
    load();
  }

  function openNewMilestone() {
    setEditingMilestone(null);
    setTitle("");
    setDescription("");
    setDueDate("");
    setOpen(true);
  }

  function openEditMilestone(m: Milestone) {
    setEditingMilestone(m);
    setTitle(m.title);
    setDescription(m.description ?? "");
    setDueDate(m.dueDate ? new Date(m.dueDate).toISOString().slice(0, 10) : "");
    setOpen(true);
  }

  async function deleteMilestone(m: Milestone) {
    await fetch(`/api/projects/${projectId}/milestones`, {
      method: "DELETE",
      body: JSON.stringify({ id: m.id }),
    });
    load();
  }

  async function toggleMilestone(m: Milestone) {
    await fetch(`/api/projects/${projectId}/milestones`, {
      method: "PUT",
      body: JSON.stringify({ id: m.id, completed: m.completed ? 0 : 1 }),
    });
    load();
  }

  // Expenses
  const [eOpen, setEOpen] = useState(false);
  const [eTitle, setETitle] = useState("");
  const [eAmount, setEAmount] = useState("");
  const [eDate, setEDate] = useState("");
  const [eNotes, setENotes] = useState("");
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  function openNewExpense() {
    setEditingExpense(null);
    setETitle("");
    setEAmount("");
    setEDate("");
    setENotes("");
    setEOpen(true);
  }

  function openEditExpense(exp: Expense) {
    setEditingExpense(exp);
    setETitle(exp.title ?? "");
    setEAmount(String(exp.amount ?? ""));
    setEDate(
      exp.spentAt ? new Date(exp.spentAt).toISOString().slice(0, 10) : "",
    );
    setENotes(exp.notes ?? "");
    setEOpen(true);
  }

  async function saveExpense() {
    const payload = {
      title: eTitle,
      amount: Number(eAmount) || 0,
      spentAt: eDate || null,
      notes: eNotes || null,
    };
    if (editingExpense?.id) {
      await fetch(`/api/projects/${projectId}/expenses`, {
        method: "PUT",
        body: JSON.stringify({ id: editingExpense.id, ...payload }),
      });
    } else {
      await fetch(`/api/projects/${projectId}/expenses`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    }
    setEOpen(false);
    load();
  }

  async function deleteExpense(exp: Expense) {
    await fetch(`/api/projects/${projectId}/expenses`, {
      method: "DELETE",
      body: JSON.stringify({ id: exp.id }),
    });
    load();
  }

  // CSV exporters
  function downloadCSV(filename: string, rows: string[][]) {
    const csvContent = rows
      .map((r) =>
        r
          .map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`)
          .join(","),
      )
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function exportMilestonesCSV() {
    const header = ["Title", "Description", "Due Date", "Completed"];
    const data = milestones.map((m) => [
      m.title,
      m.description ?? "",
      m.dueDate ? new Date(m.dueDate).toLocaleDateString() : "",
      m.completed ? "Yes" : "No",
    ]);
    downloadCSV(`${project?.name ?? "project"}-milestones.csv`, [
      header,
      ...data,
    ]);
  }

  function exportExpensesCSV() {
    const header = ["Title", "Amount", "Date", "Notes"];
    const data = expenses.map((e) => [
      e.title,
      String(e.amount ?? 0),
      e.spentAt ? new Date(e.spentAt).toLocaleDateString() : "",
      e.notes ?? "",
    ]);
    downloadCSV(`${project?.name ?? "project"}-expenses.csv`, [
      header,
      ...data,
    ]);
  }

  const [activeTab, setActiveTab] = useState("milestones");

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-2 max-w-7xl mx-auto animate-in fade-in duration-500">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="-ml-2 hover:bg-transparent hover:text-primary"
      >
        <ChevronLeft className="mr-1 h-4 w-4" /> Back to Projects
      </Button>

      {project && (
        <ProjectHeader
          project={project}
          progress={progress}
          spent={spent}
          remaining={remaining}
        />
      )}

      <div className="flex items-center gap-4 border-b">
        <button
          type="button"
          onClick={() => setActiveTab("milestones")}
          className={`pb-3 text-sm font-medium transition-colors relative ${
            activeTab === "milestones"
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Milestones
          {activeTab === "milestones" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("expenses")}
          className={`pb-3 text-sm font-medium transition-colors relative ${
            activeTab === "expenses"
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Expenses
          {activeTab === "expenses" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
          )}
        </button>
      </div>

      <div className="min-h-[400px]">
        {activeTab === "milestones" && (
          <div className="space-y-4 animate-in slide-in-from-left-4 duration-300">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Project Milestones</h2>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportMilestonesCSV}
                >
                  Export CSV
                </Button>
                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" onClick={openNewMilestone}>
                      Add Milestone
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingMilestone ? "Edit Milestone" : "New Milestone"}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="grid sm:grid-cols-3 gap-3">
                      <div className="grid gap-1">
                        <Label htmlFor="ms-title">Title</Label>
                        <Input
                          id="ms-title"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                        />
                      </div>
                      <div className="grid gap-1">
                        <Label htmlFor="ms-due">Due date</Label>
                        <Input
                          id="ms-due"
                          type="date"
                          value={dueDate}
                          onChange={(e) => setDueDate(e.target.value)}
                        />
                      </div>
                      <div className="grid gap-1 sm:col-span-3">
                        <Label htmlFor="ms-desc">Description</Label>
                        <Textarea
                          id="ms-desc"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={saveMilestone}>
                        {editingMilestone ? "Save" : "Add"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="grid gap-3">
              {milestones.length === 0 ? (
                <div className="text-center py-12 border rounded-lg bg-muted/10 border-dashed">
                  <p className="text-muted-foreground">No milestones yet</p>
                </div>
              ) : (
                milestones.map((m) => (
                  <div
                    key={m.id}
                    className="group flex items-start justify-between gap-4 rounded-lg border bg-card p-4 transition-all hover:shadow-sm hover:border-primary/20"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-1 h-2 w-2 rounded-full ${m.completed ? "bg-green-500" : "bg-gray-300"}`}
                      />
                      <div>
                        <div
                          className={`font-medium ${m.completed ? "line-through text-muted-foreground" : ""}`}
                        >
                          {m.title}
                        </div>
                        {m.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {m.description}
                          </p>
                        )}
                        {m.dueDate && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                            <Calendar className="h-3 w-3" />
                            Due: {new Date(m.dueDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant={m.completed ? "secondary" : "default"}
                        size="sm"
                        onClick={() => toggleMilestone(m)}
                      >
                        {m.completed ? "Undo" : "Complete"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditMilestone(m)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteMilestone(m)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "expenses" && (
          <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Project Expenses</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={exportExpensesCSV}>
                  Export CSV
                </Button>
                <Dialog open={eOpen} onOpenChange={setEOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" onClick={openNewExpense}>
                      Add Expense
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingExpense ? "Edit Expense" : "New Expense"}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="grid sm:grid-cols-3 gap-3">
                      <div className="grid gap-1">
                        <Label htmlFor="ex-title">Title</Label>
                        <Input
                          id="ex-title"
                          value={eTitle}
                          onChange={(e) => setETitle(e.target.value)}
                        />
                      </div>
                      <div className="grid gap-1">
                        <Label htmlFor="ex-amount">Amount</Label>
                        <Input
                          id="ex-amount"
                          type="number"
                          value={eAmount}
                          onChange={(e) => setEAmount(e.target.value)}
                        />
                      </div>
                      <div className="grid gap-1">
                        <Label htmlFor="ex-date">Date</Label>
                        <Input
                          id="ex-date"
                          type="date"
                          value={eDate}
                          onChange={(e) => setEDate(e.target.value)}
                        />
                      </div>
                      <div className="grid gap-1 sm:col-span-3">
                        <Label htmlFor="ex-notes">Notes</Label>
                        <Textarea
                          id="ex-notes"
                          value={eNotes}
                          onChange={(e) => setENotes(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={saveExpense}>
                        {editingExpense ? "Save" : "Add"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="grid gap-3">
              {expenses.length === 0 ? (
                <div className="text-center py-12 border rounded-lg bg-muted/10 border-dashed">
                  <p className="text-muted-foreground">No expenses recorded</p>
                </div>
              ) : (
                expenses.map((ex) => (
                  <div
                    key={ex.id}
                    className="group flex items-center justify-between rounded-lg border bg-card p-4 transition-all hover:shadow-sm hover:border-primary/20"
                  >
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-amber-100 p-2 dark:bg-amber-900/30">
                        <Receipt className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <div className="font-medium">{ex.title}</div>
                        <div className="text-lg font-bold text-primary">
                          ₦{(ex.amount ?? 0).toLocaleString()}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          {ex.spentAt && (
                            <span>
                              {new Date(ex.spentAt).toLocaleDateString()}
                            </span>
                          )}
                          {ex.notes && (
                            <>
                              <span>•</span>
                              <span className="truncate max-w-[200px]">
                                {ex.notes}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditExpense(ex)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteExpense(ex)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
