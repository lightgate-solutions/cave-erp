import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { Card, CardContent } from "../ui/card";
import { SessionManagement } from "./session-management";

export default async function SessionsTab({
  currentSessionToken,
}: {
  currentSessionToken: string;
}) {
  const sessions = await auth.api.listSessions({ headers: await headers() });

  return (
    <Card>
      <CardContent>
        <SessionManagement
          sessions={sessions}
          currentSessionToken={currentSessionToken}
        />
      </CardContent>
    </Card>
  );
}
