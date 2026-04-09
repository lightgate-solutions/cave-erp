import { getUser } from "@/actions/auth/dal";
import { getActiveFolderDocuments } from "@/actions/documents/documents";
import { getSubFolders } from "@/actions/documents/folders";
import FolderContentWrapper from "@/components/documents/folder-content-wrapper";
import { notFound } from "next/navigation";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id: foldersId } = await params;
  const sp = await searchParams;
  const pageParam = Array.isArray(sp?.page) ? sp?.page[0] : sp?.page;
  const pageSizeParam = Array.isArray(sp?.pageSize)
    ? sp?.pageSize[0]
    : sp?.pageSize;
  const qParam = Array.isArray(sp?.q) ? sp?.q[0] : sp?.q;
  const page = Number(pageParam) > 0 ? Number(pageParam) : 1;
  const pageSize = Number(pageSizeParam) > 0 ? Number(pageSizeParam) : 20;
  const folderSearchQuery = typeof qParam === "string" ? qParam : "";
  const user = await getUser();
  if (!user) notFound();

  const currentFolderId = foldersId.at(-1);

  const subFolders = await getSubFolders(Number(currentFolderId));

  const documents = await getActiveFolderDocuments(
    Number(currentFolderId),
    page,
    pageSize,
    folderSearchQuery,
  );

  if (documents.error) notFound();

  return (
    <div className="space-y-6">
      <FolderContentWrapper
        subFolders={subFolders}
        documents={documents.success.docs}
        folderSearchQuery={folderSearchQuery}
        paging={{
          page: documents.success.page,
          pageSize: documents.success.pageSize,
          total: documents.success.total,
          totalPages: documents.success.totalPages,
          hasMore: documents.success.hasMore,
        }}
        department={user.department}
      />
    </div>
  );
}
