/** biome-ignore-all lint/suspicious/noArrayIndexKey: <> */

import { Mail, Users, X } from "lucide-react";
import { headers } from "next/headers";
import { InviteActions } from "@/components/settings/invites-actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { auth } from "@/lib/auth";

export default async function InvitesPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  const userInvitations = await auth.api.listUserInvitations({
    query: {
      email: session.user.email,
    },
  });

  const pendingInvitations = userInvitations.filter(
    (invite) => invite.status === "pending",
  );

  const ids = pendingInvitations.map((inv) => inv.id);

  const invitations = await Promise.all(
    ids.map(async (id) => {
      const invitation = await auth.api.getInvitation({
        headers: await headers(),
        query: { id },
      });
      return invitation;
    }),
  );

  const validInvitations = invitations.filter(Boolean);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-4 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Organization Invites</h1>
          </div>
          <p className="text-muted-foreground">
            Manage invitations to join organizations
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {validInvitations.length === 0 ? (
          <Card className="border-border">
            <CardContent className="pt-12 pb-12 text-center">
              <div className="mb-4 inline-block p-3 bg-muted rounded-lg">
                <Mail className="w-6 h-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No invites yet</h3>
              <p className="text-muted-foreground">
                You don't have any pending organization invites. When you
                receive one, it will appear here.
              </p>
            </CardContent>
          </Card>
        ) : validInvitations.length > 0 ? (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              {validInvitations.length} pending{" "}
              {validInvitations.length === 1 ? "invite" : "invites"}
            </div>
            {validInvitations.map((invite, idx) => (
              <Card
                key={idx}
                className="border-border hover:shadow-sm transition-shadow"
              >
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Users className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold">
                              {invite.organizationName}
                            </h3>
                            <Badge
                              variant="secondary"
                              className="bg-primary/10 text-primary hover:bg-primary/20"
                            >
                              {invite.role}
                            </Badge>
                          </div>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <p className="flex items-center gap-2">
                              <span className="inline-block">Invited by</span>
                              <span className="font-medium text-foreground">
                                {invite.inviterEmail}
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 md:flex-col lg:flex-row">
                      <InviteActions
                        inviteId={invite.id}
                        orgId={invite.organizationId}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-border">
            <CardContent className="pt-12 pb-12 text-center">
              <div className="mb-4 inline-block p-3 bg-muted rounded-lg">
                <X className="w-6 h-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                All invites handled
              </h3>
              <p className="text-muted-foreground">
                You've responded to all your pending invites.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
