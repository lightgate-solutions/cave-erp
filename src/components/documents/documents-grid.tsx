"use client";

import { FileIcon, MoreVertical, Trash2, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePathname, useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import type { getActiveFolderDocuments } from "@/actions/documents/documents";
import { DocumentSheet } from "./document-sheet";
import { DocumentsActions } from "./document-actions";

type DocumentType = NonNullable<
  Awaited<ReturnType<typeof getActiveFolderDocuments>>["success"]
>["docs"][number];

export default function DocumentsGrid({
  documents,
  paging,
}: {
  documents: DocumentType[];
  paging?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages?: number;
    hasMore?: boolean;
  };
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const page = paging?.page ?? Number(searchParams?.get("page") ?? 1);
  const pageSize =
    paging?.pageSize ?? Number(searchParams?.get("pageSize") ?? 20);
  const total = paging?.total;
  const totalPages =
    paging?.totalPages ??
    (total !== undefined
      ? Math.max(1, Math.ceil(total / pageSize))
      : undefined);
  const hasMore = paging?.hasMore ?? (totalPages ? page < totalPages : false);
  const start = total !== undefined ? (page - 1) * pageSize + 1 : undefined;
  const end =
    total !== undefined ? Math.min(page * pageSize, total) : undefined;

  function goToPage(p: number) {
    if (p < 1) return;
    if (totalPages && p > totalPages) return;
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set("page", String(p));
    params.set("pageSize", String(pageSize));
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 animate-in fade-in duration-500">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="group relative flex flex-col justify-between overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md hover:border-primary/50"
          >
            <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 bg-background/80 backdrop-blur-sm"
                  >
                    <MoreVertical size={16} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <DocumentsActions
                      type="archive"
                      id={doc.id}
                      pathname={pathname}
                      trigger={
                        <div className="flex items-center w-full cursor-pointer">
                          <Archive className="mr-2 h-4 w-4" />
                          Archive
                        </div>
                      }
                    />
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive" asChild>
                    <DocumentsActions
                      type="delete"
                      id={doc.id}
                      pathname={pathname}
                      trigger={
                        <div className="flex items-center w-full cursor-pointer">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </div>
                      }
                    />
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="p-6 flex flex-col items-center justify-center flex-1 min-h-[160px] bg-muted/30 group-hover:bg-muted/50 transition-colors">
              <div className="h-16 w-16 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-4">
                <FileIcon className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-medium text-center line-clamp-2 px-2 text-sm">
                {doc.title}
              </h3>
            </div>

            <div className="p-3 border-t bg-card">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                <span>v{doc.currentVersion}</span>
                <span>{doc.fileSize} MB</span>
              </div>
              <DocumentSheet
                doc={doc}
                pathname={pathname}
                trigger={
                  <Button variant="outline" size="sm" className="w-full">
                    View Details
                  </Button>
                }
              />
            </div>
          </div>
        ))}
      </div>

      {paging && (
        <div className="flex items-center justify-between border-t pt-4">
          <div className="text-sm text-muted-foreground">
            {total !== undefined && start !== undefined && end !== undefined
              ? `Showing ${start}-${end} of ${total}`
              : null}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
            >
              Previous
            </Button>
            <Button
              size="sm"
              onClick={() => goToPage(page + 1)}
              disabled={!hasMore}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
