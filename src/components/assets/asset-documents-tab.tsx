"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  FileText,
  Image,
  File,
  Download,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { DocumentUploadDialog } from "./document-upload-dialog";
import { toast } from "sonner";

interface AssetDocumentsTabProps {
  assetId: number;
}

export function AssetDocumentsTab({ assetId }: AssetDocumentsTabProps) {
  const queryClient = useQueryClient();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["asset-documents", assetId],
    queryFn: async () => {
      const response = await fetch(`/api/assets/${assetId}/documents`);
      if (!response.ok) throw new Error("Failed to fetch documents");
      return response.json();
    },
  });

  const documents = data?.documents || [];

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) {
      return <Image className="h-5 w-5 text-green-500" />;
    }
    if (mimeType === "application/pdf") {
      return <FileText className="h-5 w-5 text-red-500" />;
    }
    return <File className="h-5 w-5 text-blue-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getDocumentTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      Receipt: "bg-green-100 text-green-700",
      Invoice: "bg-blue-100 text-blue-700",
      Warranty: "bg-purple-100 text-purple-700",
      Photos: "bg-yellow-100 text-yellow-700",
      Manual: "bg-gray-100 text-gray-700",
      "Maintenance Record": "bg-orange-100 text-orange-700",
      "Inspection Report": "bg-cyan-100 text-cyan-700",
      "Disposal Certificate": "bg-red-100 text-red-700",
      Other: "bg-gray-100 text-gray-700",
    };

    return (
      <span
        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${colors[type] || "bg-gray-100 text-gray-700"}`}
      >
        {type}
      </span>
    );
  };

  const handleDelete = async () => {
    if (!documentToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(
        `/api/assets/${assetId}/documents?documentId=${documentToDelete}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to delete document");
      }

      toast.success("Document deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["asset-documents", assetId] });
    } catch (_error) {
      toast.error("Failed to delete document");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Documents</CardTitle>
            <CardDescription>
              Attached files and documents for this asset
            </CardDescription>
          </div>
          <Button size="sm" onClick={() => setUploadDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Upload Document
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground py-4 text-center">
              Loading documents...
            </p>
          ) : documents.length === 0 ? (
            <p className="text-muted-foreground py-4">
              No documents attached to this asset yet. Upload receipts,
              invoices, warranty documents, and more.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map(
                  (doc: {
                    id: number;
                    documentName: string;
                    documentType: string;
                    mimeType: string;
                    fileSize: number;
                    createdAt: string;
                    url: string | null;
                  }) => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {getFileIcon(doc.mimeType)}
                          <span className="font-medium truncate max-w-[200px]">
                            {doc.documentName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getDocumentTypeBadge(doc.documentType)}
                      </TableCell>
                      <TableCell>{formatFileSize(doc.fileSize)}</TableCell>
                      <TableCell>
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {doc.url && (
                            <>
                              <Button variant="ghost" size="icon" asChild>
                                <a
                                  href={doc.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </Button>
                              <Button variant="ghost" size="icon" asChild>
                                <a href={doc.url} download={doc.documentName}>
                                  <Download className="h-4 w-4" />
                                </a>
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setDocumentToDelete(doc.id);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ),
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <DocumentUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        assetId={assetId}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this document? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
