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
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DocumentSheet } from "./document-sheet";
import { DocumentsActions } from "./document-actions";

type DocumentType = NonNullable<
  Awaited<ReturnType<typeof getActiveFolderDocuments>>["success"]
>["docs"][number];

export default function DocumentsTable({
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
    <div className="space-y-4">
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-12"></TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Uploaded By</TableHead>
              <TableHead>Last Modified</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground py-8"
                >
                  No documents found
                </TableCell>
              </TableRow>
            ) : (
              documents.map((doc) => (
                <TableRow key={doc.id} className="group hover:bg-muted/50">
                  <TableCell>
                    <FileIcon size={24} className="text-blue-600" />
                  </TableCell>
                  <TableCell className="font-medium">
                    {doc.title.charAt(0).toUpperCase() + doc.title.slice(1)}
                  </TableCell>
                  <TableCell>{doc.uploader}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {doc.updatedAt.toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">v{doc.currentVersion}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        doc.status === "active" ? "secondary" : "destructive"
                      }
                      className={
                        doc.status === "active"
                          ? "bg-green-100 text-green-700 hover:bg-green-100/80 dark:bg-green-900/30 dark:text-green-400"
                          : ""
                      }
                    >
                      {doc.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <DocumentSheet
                        doc={doc}
                        pathname={pathname}
                        trigger={
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        }
                      />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="px-2">
                            <MoreVertical size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="space-y-1">
                          <DropdownMenuItem
                            className="hover:cursor-pointer"
                            asChild
                          >
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
                          <DropdownMenuItem
                            className="text-destructive hover:cursor-pointer"
                            asChild
                          >
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
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {paging && (
        <div className="flex items-center justify-between">
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
