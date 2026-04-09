"use client";

import { useSearchParams } from "next/navigation";
import DocumentsGrid from "./documents-grid";
import DocumentsTable from "./documents-table";
import type { ViewType } from "./view-toggle/view-toggle";
import type { getActiveFolderDocuments } from "@/actions/documents/documents";

type DocumentType = NonNullable<
  Awaited<ReturnType<typeof getActiveFolderDocuments>>["success"]
>["docs"][number];

export default function DocumentsViewWrapper({
  documents,
  paging,
  listContext = "default",
}: {
  documents: DocumentType[];
  listContext?: "default" | "archived";
  paging?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages?: number;
    hasMore?: boolean;
  };
}) {
  const searchParams = useSearchParams();
  const view = (searchParams?.get("view") as ViewType) ?? "card";

  if (view === "table") {
    return (
      <DocumentsTable
        documents={documents}
        paging={paging}
        listContext={listContext}
      />
    );
  }

  return (
    <DocumentsGrid
      documents={documents}
      paging={paging}
      listContext={listContext}
    />
  );
}
