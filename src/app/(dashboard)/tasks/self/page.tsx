import { getUser, getUserPermissionContext } from "@/actions/auth/dal";
import { TaskBoardContainer } from "@/components/task/task-board-container";
import { redirect } from "next/navigation";

export default async function SelfAssignTasksPage() {
  const user = await getUser();
  const permissionContext = await getUserPermissionContext();

  if (!user) {
    redirect("/login");
  }

  const boardRole =
    permissionContext?.role === "admin"
      ? "admin"
      : permissionContext?.isManager
        ? "manager"
        : "employee";

  return (
    <TaskBoardContainer
      userId={user.id}
      boardView="self-assign"
      role={boardRole}
    />
  );
}
