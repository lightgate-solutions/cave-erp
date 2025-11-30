"use client";

import { Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { BetterAuthActionButton } from "@/components/auth/better-auth-action-button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { authClient } from "@/lib/auth-client";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { CreateInviteButton } from "./create-invite-button";

export function InvitesCard() {
  const { data: activeOrganization } = authClient.useActiveOrganization();
  const pendingInvites = activeOrganization?.invitations?.filter(
    (invite) => invite.status === "pending",
  );
  const [role, setRole] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function getRole() {
      try {
        const { data, error } =
          await authClient.organization.getActiveMemberRole();
        if (error) {
          setError(error.message || "Failed to fetch user role.");
        } else if (data?.role) {
          setRole(data.role);
        }
      } catch (_err) {
        setError("An unexpected error occurred while fetching your role.");
      } finally {
        setLoading(false);
      }
    }

    getRole();
  }, []);

  function cancelInvitation(invitationId: string) {
    return authClient.organization.cancelInvitation({ invitationId });
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-8 w-48" />
          </CardTitle>
          <div className="justify-end flex">
            <Skeleton className="h-10 w-24" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      {role === "owner" || role === "admin" ? (
        <Card className="space-y-4">
          <CardHeader>
            <CardTitle>Manage Invites</CardTitle>

            <div className="justify-end flex">
              <CreateInviteButton />
            </div>
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingInvites?.map((invitation) => (
                  <TableRow key={invitation.id}>
                    <TableCell>{invitation.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{invitation.role}</Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(invitation.expiresAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <BetterAuthActionButton
                        variant="destructive"
                        size="sm"
                        action={() => cancelInvitation(invitation.id)}
                      >
                        Cancel
                      </BetterAuthActionButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <div className="flex items-center justify-center min-h-96 bg-background">
          <div className="flex flex-col items-center justify-center gap-6 px-4 text-center max-w-md">
            <div className="rounded-full bg-destructive/10 p-4">
              <Lock className="h-8 w-8 text-destructive" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">
                Access Denied
              </h1>
              <p className="text-muted-foreground">
                Only an owner or admin can manage this organization.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
