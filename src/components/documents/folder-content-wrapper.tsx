"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import DocumentsViewWrapper from "@/components/documents/documents-view-wrapper";
import FoldersViewWrapper from "@/components/documents/folders/folders-view-wrapper";
import { ViewToggle } from "@/components/documents/view-toggle/view-toggle";
import type { getActiveFolderDocuments } from "@/actions/documents/documents";
import { DocumentSearch } from "./document-search";

type DocumentType = NonNullable<
  Awaited<ReturnType<typeof getActiveFolderDocuments>>["success"]
>["docs"][number];

interface FolderContentWrapperProps {
  subFolders: {
    id: number;
    name: string;
    path?: string;
    updatedAt: Date;
  }[];
  documents: DocumentType[];
  /** Mirrors `q` search param; drives server-side document search. */
  folderSearchQuery?: string;
  paging?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages?: number;
    hasMore?: boolean;
  };
  department: string;
}

export default function FolderContentWrapper({
  subFolders,
  documents,
  folderSearchQuery = "",
  paging,
  department,
}: FolderContentWrapperProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [searchTerm, setSearchTerm] = useState(() => folderSearchQuery ?? "");

  useEffect(() => {
    setSearchTerm(folderSearchQuery ?? "");
  }, [folderSearchQuery]);

  const syncSearchToUrl = useDebouncedCallback((raw: string) => {
    const params = new URLSearchParams(
      typeof window !== "undefined" ? window.location.search : "",
    );
    const t = (raw ?? "").trim();
    if (t) params.set("q", t);
    else params.delete("q");
    params.delete("page");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, 300);

  function handleSearchChange(value: string) {
    const next = value ?? "";
    setSearchTerm(next);
    syncSearchToUrl(next);
  }

  const q = (searchTerm ?? "").trim().toLowerCase();
  const filteredSubFolders = subFolders.filter((folder) =>
    q === "" ? true : folder.name.toLowerCase().includes(q),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <DocumentSearch
          value={searchTerm ?? ""}
          onChange={handleSearchChange}
          placeholder="Search documents (title, description, tags)..."
        />
        <ViewToggle />
      </div>
      <FoldersViewWrapper
        folders={filteredSubFolders}
        department={department}
      />
      <DocumentsViewWrapper documents={documents} paging={paging} />
    </div>
  );
}
