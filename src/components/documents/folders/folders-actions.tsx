import { Dialog } from "@/components/ui/dialog";
import UploadDocumentButton from "../upload-document-button";
import CreateFolderButton from "./create-folder-button";

export default async function FoldersActions({
  usersFolders,
  department,
  lockedFolderName,
  lockedFolderDisplay,
  lockedParentFolderId,
}: {
  usersFolders: { id: number; name: string; path?: string; updatedAt: Date }[];
  department: string;
  lockedFolderName?: string | null;
  lockedFolderDisplay?: string | null;
  /** When set (folder route), new folders are created as children of this folder. */
  lockedParentFolderId?: number;
}) {
  return (
    <div className="space-y-2">
      <Dialog>
        <UploadDocumentButton
          usersFolders={usersFolders}
          department={department}
          lockedFolderName={lockedFolderName}
          lockedFolderDisplay={lockedFolderDisplay}
        />
      </Dialog>

      <CreateFolderButton
        usersFolders={usersFolders}
        department={department}
        lockedParentFolderId={lockedParentFolderId}
        lockedParentFolderHint={lockedFolderDisplay ?? null}
      />
    </div>
  );
}
