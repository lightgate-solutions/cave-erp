"use client";

import { useEffect, useState } from "react";
import { BetterAuthActionButton } from "@/components/auth/better-auth-action-button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { authClient } from "@/lib/auth-client";
import ErrorComponent from "../error-component";

export function MembersTable() {
  const {
    data: activeOrganization,
    isPending: orgPending,
    error: orgError,
  } = authClient.useActiveOrganization();
  const { data: session, isPending, error, refetch } = authClient.useSession();
  const [role, setRole] = useState<string>("");

  useEffect(() => {
    async function getRole() {
      const { data } = await authClient.organization.getActiveMemberRole();
      if (!data?.role) return null;
      setRole(data.role);
    }

    getRole();
  }, []);

  if (isPending || orgPending) return null;

  if (error || orgError) {
    return <ErrorComponent onRefresh={() => refetch()} />;
  }

  function removeMember(memberId: string) {
    return authClient.organization.removeMember({
      memberIdOrEmail: memberId,
    });
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {activeOrganization?.members?.map((member) => (
          <TableRow key={member.id}>
            <TableCell>{member.user.name}</TableCell>
            <TableCell>{member.user.email}</TableCell>
            <TableCell>
              <Badge
                variant={
                  member.role === "owner"
                    ? "default"
                    : member.role === "admin"
                      ? "secondary"
                      : "outline"
                }
              >
                {member.role}
              </Badge>
            </TableCell>
            <TableCell>
              {role === "owner" ? (
                <div>
                  {member.userId !== session?.user.id && (
                    <BetterAuthActionButton
                      requireAreYouSure
                      variant="destructive"
                      size="sm"
                      action={() => removeMember(member.id)}
                    >
                      Remove
                    </BetterAuthActionButton>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-muted-foreground text-sm">No actions</p>
                </div>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
