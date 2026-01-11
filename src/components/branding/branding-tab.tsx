"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LogoUpload } from "./logo-upload";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export function BrandingTab() {
  const { data: session } = authClient.useSession();
  const { data: activeOrg } = authClient.useActiveOrganization();
  const { data: orgs } = authClient.useListOrganizations();
  const router = useRouter();

  if (!activeOrg || !session) {
    return <p>Loading...</p>;
  }

  // Find full organization data
  const org = orgs?.find((o) => o.id === activeOrg.id);
  const isOwner = org && (org as any).ownerId === session.user.id;

  function handleUploadComplete() {
    router.refresh();
    // Trigger organization list refetch
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("organization:changed"));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organization Branding</CardTitle>
        <CardDescription>
          Customize your organization's visual identity
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isOwner ? (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Organization Logo</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Upload a logo to represent your organization. It will appear in
                the organization switcher.
              </p>
              <LogoUpload
                organizationId={activeOrg.id}
                currentLogoUrl={(org as any)?.logo}
                onUploadComplete={handleUploadComplete}
              />
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground">
            Only organization owners can manage branding settings.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
