"use client";

import { useState } from "react";
import { TaskHeader } from "./header/task-header";
import { TaskBoard } from "./board/task-board";

interface TaskBoardContainerProps {
  userId: string;
  role: "employee" | "manager" | "admin";
}

export function TaskBoardContainer({ userId, role }: TaskBoardContainerProps) {
  const [priority, setPriority] = useState("all");
  const [assignee, setAssignee] = useState("all");
  const [search, setSearch] = useState("");

  return (
    <div className="flex-1 flex flex-col overflow-hidden h-[calc(100vh-5rem)]">
      <TaskHeader
        userId={userId}
        role={role}
        priority={priority}
        assignee={assignee}
        search={search}
        onPriorityChange={setPriority}
        onAssigneeChange={setAssignee}
        onSearchChange={setSearch}
      />
      <main className="w-full h-full overflow-x-auto">
        <TaskBoard
          userId={userId}
          role={role}
          priority={priority}
          assignee={assignee}
          search={search}
        />
      </main>
    </div>
  );
}
