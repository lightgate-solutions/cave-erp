import LeavesTable from "@/components/hr/leaves-table";
import { requireAuth } from "@/actions/auth/dal";
import { DEPARTMENTS } from "@/lib/permissions/types";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Settings } from "lucide-react";

export default async function Page() {
  const authData = await requireAuth();

  const isHROrAdmin =
    authData.role === "admin" ||
    authData.employee?.department === DEPARTMENTS.HR ||
    authData.employee?.department === DEPARTMENTS.ADMIN;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div>
            <h1 className="text-2xl font-bold">
              {isHROrAdmin ? "Leave Management" : "My Leaves"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isHROrAdmin
                ? "View and manage employee leave applications"
                : "View and apply for leaves"}
            </p>
          </div>
        </div>
        {isHROrAdmin && (
          <Button asChild variant="outline">
            <Link href="/hr/leaves/annual-balances">
              <Settings className="mr-2 h-4 w-4" />
              Manage Annual Leaves
            </Link>
          </Button>
        )}
      </div>
      <LeavesTable
        userId={isHROrAdmin ? undefined : authData.userId}
        isHR={isHROrAdmin}
        showFilters={true}
      />
    </div>
  );
}
