"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Eye, Pencil, Trash2, Settings } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { ProjectFormDialog } from "./project-form-dialog";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { ProjectAccessDialog } from "./project-access-dialog";
import { ProjectRoleBadges } from "./project-role-badges";

type Project = {
  id: number;
  name: string;
  code: string;
  description: string | null;
  location: string | null;
  supervisorId: string | null;
  createdAt: string;
  supervisorName?: string;
  status?: string;
  budgetPlanned?: number;
  budgetActual?: number;
  permission?: "view" | "edit" | "manage" | null;
  userRoles?: string[];
};

export function ProjectsTable() {
  const [items, setItems] = useState<Project[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, _setLimit] = useState(10);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [_loading, setLoading] = useState(false);
  const [_editProject, _setEditProject] = useState<Project | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const statusParam = status === "all" ? "" : status;
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        q: q,
        status: statusParam,
      });
      if (dateFrom) params.append("dateFrom", dateFrom);
      if (dateTo) params.append("dateTo", dateTo);
      const res = await fetch(`/api/projects?${params.toString()}`);
      const data = await res.json();

      // The API now includes permission data for each project
      setItems(data.projects ?? []);
      setTotal(data.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [page, limit, q, status, dateFrom, dateTo]);

  const prevFiltersRef = useRef({ q, status, dateFrom, dateTo });
  useEffect(() => {
    const prevFilters = prevFiltersRef.current;
    const filtersChanged =
      prevFilters.q !== q ||
      prevFilters.status !== status ||
      prevFilters.dateFrom !== dateFrom ||
      prevFilters.dateTo !== dateTo;

    if (filtersChanged) {
      setPage(1);
      prevFiltersRef.current = { q, status, dateFrom, dateTo };
    }
  }, [q, status, dateFrom, dateTo]);

  useEffect(() => {
    load();

    const handler = () => load();
    if (typeof window !== "undefined") {
      window.addEventListener("organization:changed", handler);
      window.addEventListener("projects:changed", handler);

      const detail = { q, status, dateFrom, dateTo };
      window.dispatchEvent(new CustomEvent("projects:filters", { detail }));
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("organization:changed", handler);
        window.removeEventListener("projects:changed", handler);
      }
    };
  }, [load, q, status, dateFrom, dateTo]);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const handleDelete = async () => {
    if (deleteId) {
      await fetch(`/api/projects/${deleteId}`, { method: "DELETE" });
      load();
      setDeleteId(null);
    }
  };

  const confirmDelete = (id: number) => {
    setDeleteId(id);
    setIsDeleteOpen(true);
  };

  const clearDateFilters = () => {
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const [view, setView] = useState<"list" | "grid">("grid");

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search projects..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="flex-1"
          />
          {mounted ? (
            <Select value={status} onValueChange={(v) => setStatus(v)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <div className="w-40 h-10 border rounded-md bg-muted animate-pulse" />
          )}
          <div className="flex items-center border rounded-md bg-background">
            <Button
              variant={view === "list" ? "secondary" : "ghost"}
              size="icon"
              className="h-9 w-9 rounded-r-none"
              onClick={() => setView("list")}
            >
              <svg
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <Button
              variant={view === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="h-9 w-9 rounded-l-none"
              onClick={() => setView("grid")}
            >
              <svg
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="7" height="7" x="3" y="3" rx="1" />
                <rect width="7" height="7" x="14" y="3" rx="1" />
                <rect width="7" height="7" x="14" y="14" rx="1" />
                <rect width="7" height="7" x="3" y="14" rx="1" />
              </svg>
            </Button>
          </div>
          <ProjectFormDialog
            onCompleted={() => load()}
            trigger={<Button className="ml-auto">New Project</Button>}
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="dateFrom" className="text-sm whitespace-nowrap">
              From:
            </Label>
            <Input
              id="dateFrom"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="dateTo" className="text-sm whitespace-nowrap">
              To:
            </Label>
            <Input
              id="dateTo"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-40"
              min={dateFrom || undefined}
            />
          </div>
          {(dateFrom || dateTo) && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearDateFilters}
              className="h-9"
            >
              Clear Dates
            </Button>
          )}
        </div>
      </div>
      <Separator />

      {view === "list" ? (
        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Supervisor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((p) => {
                const canEdit =
                  p.permission === "edit" || p.permission === "manage";
                const canManage = p.permission === "manage";

                return (
                  <TableRow key={p.id} className="group">
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>{p.code}</TableCell>
                    <TableCell>{p.location}</TableCell>
                    <TableCell>
                      {(p as { supervisorName?: string }).supervisorName ?? "—"}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const status = ((p as { status?: string }).status ??
                          "pending") as string;
                        const base =
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";
                        const color =
                          status === "completed"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                            : status === "in-progress"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
                        return (
                          <div className={`${base} ${color}`}>{status}</div>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <a href={`/projects/${p.id}`} title="View">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          aria-label="View project"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </a>
                      {canEdit && (
                        <ProjectFormDialog
                          initial={p}
                          onCompleted={() => load()}
                          trigger={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              aria-label="Edit project"
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          }
                        />
                      )}
                      {canManage && (
                        <>
                          <ProjectAccessDialog
                            trigger={
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                aria-label="Manage access"
                                title="Manage access"
                              >
                                <Settings className="h-4 w-4" />
                              </Button>
                            }
                            projectId={p.id}
                            projectName={p.name}
                            currentSupervisorId={p.supervisorId}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => confirmDelete(p.id)}
                            aria-label="Delete project"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((p) => {
            const canEdit =
              p.permission === "edit" || p.permission === "manage";
            const canManage = p.permission === "manage";

            return (
              <div
                key={p.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md hover:border-primary/50"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 flex-1">
                          <h3 className="font-semibold leading-none tracking-tight">
                            {p.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {p.code}
                          </p>
                        </div>
                        {(() => {
                          const status = ((p as { status?: string }).status ??
                            "pending") as string;
                          const color =
                            status === "completed"
                              ? "bg-green-500"
                              : status === "in-progress"
                                ? "bg-blue-500"
                                : "bg-yellow-500";
                          return (
                            <div
                              className={`h-2.5 w-2.5 rounded-full ${color} flex-shrink-0 mt-1`}
                              title={status}
                            />
                          );
                        })()}
                      </div>
                      <ProjectRoleBadges roles={p.userRoles || []} />
                    </div>
                  </div>
                  <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <svg
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4"
                      >
                        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      <span>{p.location || "No location"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4"
                      >
                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      <span>
                        {(p as { supervisorName?: string }).supervisorName ??
                          "No supervisor"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t bg-muted/50 p-4">
                  <div className="text-xs text-muted-foreground">
                    Created {new Date(p.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex gap-1">
                    <a href={`/projects/${p.id}`} title="View">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </a>
                    {canEdit && (
                      <ProjectFormDialog
                        initial={p}
                        onCompleted={() => load()}
                        trigger={
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        }
                      />
                    )}
                    {canManage && (
                      <>
                        <ProjectAccessDialog
                          trigger={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                          }
                          projectId={p.id}
                          projectName={p.name}
                          currentSupervisorId={p.supervisorId}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => confirmDelete(p.id)}
                          aria-label="Delete project"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {total > limit ? (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setPage((p) => Math.max(1, p - 1));
                }}
              />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink isActive href="#">
                {page}
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  const totalPages = Math.max(1, Math.ceil(total / limit));
                  setPage((p) => Math.min(totalPages, p + 1));
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      ) : null}

      <ConfirmationDialog
        isOpen={isDeleteOpen}
        onCloseAction={() => setIsDeleteOpen(false)}
        onConfirmAction={handleDelete}
        title="Delete Project?"
        description="Are you sure you want to delete this project? This action cannot be undone."
        confirmText="Delete"
        confirmVariant="destructive"
      />
    </div>
  );
}
