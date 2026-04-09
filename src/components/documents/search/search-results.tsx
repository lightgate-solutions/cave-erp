"use client";

import type { AccessibleDocumentSearchRow } from "@/actions/documents/documents";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, Search } from "lucide-react";
import Link from "next/link";

export function SearchResults({
  results,
  isSearching,
  queryTrimmed,
}: {
  results: AccessibleDocumentSearchRow[];
  isSearching: boolean;
  queryTrimmed: string;
}) {
  const idle = queryTrimmed.length === 0;

  if (idle && !isSearching) {
    return (
      <div className="flex flex-col items-center justify-center py-4 px-4">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full" />
          <div className="relative bg-gradient-to-br from-primary/20 to-primary/5 p-8 rounded-full">
            <Search className="h-16 w-16 text-primary" strokeWidth={1.5} />
          </div>
        </div>
        <h2 className="text-2xl font-semibold mb-2 text-balance text-center">
          Search your documents
        </h2>
        <p className="text-muted-foreground text-center max-w-md mb-6 text-balance">
          Results include only documents you can access in your organization.
          Search runs as you type.
        </p>
      </div>
    );
  }

  if (!idle && !isSearching && results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <p className="text-muted-foreground max-w-md">
          No documents match &quot;{queryTrimmed}&quot;. Try different keywords
          (title, description, folder name, or tags).
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {isSearching
            ? "Searching…"
            : results.length === 0
              ? null
              : `${results.length} result${results.length === 1 ? "" : "s"}`}
        </p>
      </div>

      {results.length > 0 ? (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead className="">Department</TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer hover:bg-muted/50"
                >
                  <TableCell className="font-medium">{row.title}</TableCell>
                  <TableCell className="text-muted-foreground max-w-md truncate">
                    {row.description?.trim()
                      ? row.description
                      : "No description"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {row.tags.map((tag) => (
                        <Badge
                          key={`${row.id}-${tag}`}
                          variant="secondary"
                          className="text-xs"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">
                    {row.department ?? "—"}
                  </TableCell>
                  <TableCell className="text-right capitalize">
                    <Link href={`/documents/${row.id}`}>
                      <Button variant="link" className="hover:cursor-pointer">
                        <Eye size={16} />
                        Open
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}
    </div>
  );
}
