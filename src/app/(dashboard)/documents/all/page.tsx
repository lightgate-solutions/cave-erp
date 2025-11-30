import { getUser } from "@/actions/auth/dal";
import { getAllAccessibleDocuments } from "@/actions/documents/documents";
import DocumentsViewWrapper from "@/components/documents/documents-view-wrapper";
import { ViewToggle } from "@/components/documents/view-toggle/view-toggle";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const pageParam = Array.isArray(sp?.page) ? sp?.page[0] : sp?.page;
  const pageSizeParam = Array.isArray(sp?.pageSize)
    ? sp?.pageSize[0]
    : sp?.pageSize;
  const page = Number(pageParam) > 0 ? Number(pageParam) : 1;
  const pageSize = Number(pageSizeParam) > 0 ? Number(pageSizeParam) : 20;

  const user = await getUser();
  if (!user) return null;

  const documents = await getAllAccessibleDocuments(page, pageSize);
  if (documents.error) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="size-4" />
              Back to Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-semibold">All Documents</h1>
            <p className="text-sm text-muted-foreground">
              A flat list of all documents you own or have access to.
            </p>
          </div>
        </div>
        <ViewToggle />
      </div>
      <DocumentsViewWrapper
        documents={documents.success.docs}
        paging={{
          page: documents.success.page,
          pageSize: documents.success.pageSize,
          total: documents.success.total,
          totalPages: documents.success.totalPages,
          hasMore: documents.success.hasMore,
        }}
      />
    </div>
  );
}
