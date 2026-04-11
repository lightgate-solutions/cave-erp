"use client";

import { unarchiveFolder } from "@/actions/documents/folders";
import { Button } from "@/components/ui/button";
import { ArchiveRestore } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function RestoreArchivedFolderButton({
  folderId,
}: {
  folderId: number;
}) {
  const router = useRouter();

  return (
    <Button
      variant="secondary"
      size="sm"
      className="w-full gap-2"
      onClick={async () => {
        const pathname = "/documents/archive";
        const res = await unarchiveFolder(folderId, pathname);
        if (res.error) {
          toast.error(res.error.reason);
        } else if (res.success) {
          toast.success(res.success.reason);
          router.refresh();
        }
      }}
    >
      <ArchiveRestore className="size-4" />
      Restore
    </Button>
  );
}
