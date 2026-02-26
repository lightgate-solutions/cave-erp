import { describe, it, expect, beforeEach } from "vitest";
import {
    mockGetEmployee,
    mockGetFullOrganization,
    queueDbResult,
    DEFAULT_ORG_ID,
    DEFAULT_USER_ID,
} from "./helpers/setup";
import {
    createTask,
    updateTask,
    deleteTask,
    getTasksForEmployee,
    getTasksByManager,
} from "@/actions/tasks/tasks";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const mockManager = {
    id: 1,
    authId: DEFAULT_USER_ID,
    name: "Team Manager",
    isManager: true,
    organizationId: DEFAULT_ORG_ID,
};

const mockWorker = {
    id: 2,
    authId: "worker-1",
    name: "Worker",
    isManager: false,
    organizationId: DEFAULT_ORG_ID,
};

function setup(hasOrg = true) {
    mockGetEmployee.mockResolvedValue(mockManager);
    if (hasOrg) {
        mockGetFullOrganization.mockResolvedValue({ id: DEFAULT_ORG_ID });
    } else {
        mockGetFullOrganization.mockResolvedValue(null);
    }
}

const taskInput = {
    title: "Implement feature X",
    description: "Build the feature as per spec",
    organizationId: DEFAULT_ORG_ID,
    assignedBy: DEFAULT_USER_ID,
    assignedTo: "worker-1",
    dueDate: "2025-08-01",
    priority: "High" as const,
    status: "Pending" as const,
};

const mockTask = {
    id: 1,
    title: "Implement feature X",
    description: "Build the feature as per spec",
    assignedBy: DEFAULT_USER_ID,
    assignedTo: "worker-1",
    dueDate: "2025-08-01",
    priority: "High",
    status: "Pending",
    organizationId: DEFAULT_ORG_ID,
    createdAt: new Date(),
};

// ─── createTask ───────────────────────────────────────────────────────────────

describe("createTask", () => {
    beforeEach(() => setup());

    it("returns error if assigner is not a manager", async () => {
        mockGetEmployee.mockResolvedValue(mockWorker);
        const result = await createTask(taskInput);
        expect(result.error?.reason).toContain("Only managers can create tasks");
    });

    it("returns error when org not found", async () => {
        setup(false);
        const result = await createTask(taskInput);
        expect(result.error?.reason).toContain("Organization not found");
    });

    it("returns error if manager not found", async () => {
        mockGetEmployee.mockResolvedValue(null);
        const result = await createTask(taskInput);
        expect(result.error?.reason).toContain("Only managers");
    });

    it("creates task without assignees successfully", async () => {
        queueDbResult([{ id: 1 }]); // insert returning id
        const result = await createTask(taskInput);
        expect(result.success?.reason).toContain("created successfully");
        expect(result.error).toBeNull();
    });

    it("creates task with multiple assignees", async () => {
        queueDbResult([{ id: 1 }]); // task insert
        queueDbResult([]); // assignees insert
        const result = await createTask({
            ...taskInput,
            assignees: ["worker-1", "worker-2"],
        });
        expect(result.success?.reason).toContain("created successfully");
    });
});

// ─── updateTask ───────────────────────────────────────────────────────────────

describe("updateTask", () => {
    beforeEach(() => setup());

    it("returns error if employee not found", async () => {
        mockGetEmployee.mockResolvedValue(null);
        const result = await updateTask("nobody", 1, { title: "Updated" });
        expect(result.error?.reason).toContain("Employee not found");
    });

    it("returns error when org not found", async () => {
        setup(false);
        const result = await updateTask(DEFAULT_USER_ID, 1, { title: "Updated" });
        expect(result.error?.reason).toContain("Organization not found");
    });

    it("non-manager cannot mark task as completed", async () => {
        mockGetEmployee.mockResolvedValue(mockWorker);
        const result = await updateTask("worker-1", 1, { status: "Completed" });
        expect(result.error?.reason).toContain("Only managers");
    });

    it("non-manager can update status to In Progress if assigned", async () => {
        mockGetEmployee.mockResolvedValue(mockWorker);
        queueDbResult([mockTask]); // task found for employee via getTaskForEmployee
        queueDbResult([mockTask]); // current task fetch in update
        queueDbResult([]); // update
        const result = await updateTask("worker-1", 1, { status: "In Progress" });
        expect(result.success).toBeDefined();
    });

    it("non-manager gets error if not assigned to task", async () => {
        mockGetEmployee.mockResolvedValue(mockWorker);
        queueDbResult([]); // task not found for employee
        const result = await updateTask("worker-1", 999, { status: "In Progress" });
        expect(result.error?.reason).toContain("not assigned");
    });

    it("manager can update their task", async () => {
        queueDbResult([mockTask]); // task found for manager
        queueDbResult([]); // update
        const result = await updateTask(DEFAULT_USER_ID, 1, { title: "Updated" });
        expect(result.success?.reason).toContain("updated successfully");
    });

    it("manager gets error if task not owned by them", async () => {
        queueDbResult([]); // task not found for manager
        const result = await updateTask(DEFAULT_USER_ID, 999, { title: "Updated" });
        expect(result.error?.reason).toContain("only update tasks you created");
    });
});

// ─── deleteTask ───────────────────────────────────────────────────────────────

describe("deleteTask", () => {
    beforeEach(() => setup());

    it("returns error if employee not found", async () => {
        mockGetEmployee.mockResolvedValue(null);
        const result = await deleteTask(DEFAULT_USER_ID, 1);
        expect(result.error?.reason).toContain("Only managers can delete tasks");
    });

    it("returns error if not a manager", async () => {
        mockGetEmployee.mockResolvedValue(mockWorker);
        const result = await deleteTask("worker-1", 1);
        expect(result.error?.reason).toContain("Only managers");
    });

    it("returns error if task not owned by manager", async () => {
        queueDbResult([]); // task not found for manager
        const result = await deleteTask(DEFAULT_USER_ID, 999);
        // deleteTask when manager does not own the task: returns success null
        expect(result.success).toBeNull();
    });

    it("deletes task successfully", async () => {
        queueDbResult([mockTask]); // task found for manager
        queueDbResult([]); // delete assignees
        queueDbResult([]); // delete task
        const result = await deleteTask(DEFAULT_USER_ID, 1);
        expect(result.success?.reason).toContain("deleted successfully");
    });
});

// ─── getTasksForEmployee ───────────────────────────────────────────────────────

describe("getTasksForEmployee", () => {
    beforeEach(() => setup());

    it("returns empty when org not found", async () => {
        setup(false);
        const result = await getTasksForEmployee(undefined, undefined as never);
        expect(result).toEqual([]);
    });

    it("returns tasks assigned directly and via assignees table", async () => {
        queueDbResult([mockTask]); // direct assignments
        queueDbResult([{ taskId: 2 }]); // via taskAssignees
        queueDbResult([{ ...mockTask, id: 2 }]); // tasks by ids
        const result = await getTasksForEmployee(undefined, undefined as never);
        expect(Array.isArray(result)).toBe(true);
    });

    it("returns empty when no tasks assigned", async () => {
        queueDbResult([]);
        queueDbResult([]);
        const result = await getTasksForEmployee(undefined, undefined as never);
        expect(result).toEqual([]);
    });
});

// ─── getTasksByManager ────────────────────────────────────────────────────────

describe("getTasksByManager", () => {
    beforeEach(() => setup());

    it("returns empty when org not found", async () => {
        setup(false);
        const result = await getTasksByManager(DEFAULT_USER_ID);
        expect(result).toEqual([]);
    });

    it("returns tasks created by manager", async () => {
        queueDbResult([mockTask]);
        const result = await getTasksByManager(DEFAULT_USER_ID);
        expect(result).toHaveLength(1);
        expect(result[0].assignedBy).toBe(DEFAULT_USER_ID);
    });

    it("returns empty when manager has no tasks", async () => {
        queueDbResult([]);
        const result = await getTasksByManager(DEFAULT_USER_ID);
        expect(result).toEqual([]);
    });
});
