/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <> */
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Download,
  Trash2,
  FileIcon,
  FileImage,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import {
  getCandidateDocuments,
  deleteCandidateDocument,
  type CandidateDocumentType,
} from "@/actions/recruitment/candidate-documents";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface DocumentData {
  id: number;
  documentType: CandidateDocumentType;
  documentName: string;
  originalFileName: string;
  filePath: string;
  fileSize: string;
  mimeType: string | null;
  createdAt: Date;
}

export default function CandidateDocumentsList({
  candidateId,
  onRefresh,
}: {
  candidateId: number;
  onRefresh?: number; // Trigger refresh when this changes
}) {
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  const fetchDocuments = async () => {
    setLoading(true);
    const result = await getCandidateDocuments(candidateId);
    if (result.success && result.data) {
      setDocuments(result.data);
    } else {
      toast.error(result.error || "Failed to load documents");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDocuments();
  }, [candidateId, onRefresh]);

  const handleDelete = async (documentId: number) => {
    setDeleting(documentId);
    const result = await deleteCandidateDocument(
      documentId,
      window.location.pathname,
    );

    if (result.success) {
      toast.success("Document deleted successfully");
      await fetchDocuments(); // Refresh the list
    } else {
      toast.error(result.error?.reason || "Failed to delete document");
    }
    setDeleting(null);
  };

  const handleDownload = (document: DocumentData) => {
    // Open the document in a new tab
    window.open(document.filePath, "_blank");
  };

  const getFileIcon = (mimeType: string | null) => {
    if (!mimeType) return <FileIcon className="h-5 w-5" />;

    if (mimeType.startsWith("image/")) {
      return <FileImage className="h-5 w-5" />;
    }
    return <FileText className="h-5 w-5" />;
  };

  const formatFileSize = (sizeStr: string) => {
    const size = Number.parseFloat(sizeStr);
    if (size < 1) {
      return `${(size * 1024).toFixed(0)} KB`;
    }
    return `${size.toFixed(2)} MB`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getDocumentTypeBadgeVariant = (
    type: CandidateDocumentType,
  ): "default" | "secondary" | "outline" => {
    switch (type) {
      case "Resume":
        return "default";
      case "Cover Letter":
        return "secondary";
      case "Portfolio":
        return "outline";
      default:
        return "secondary";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm text-muted-foreground">
          Loading documents...
        </div>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No documents yet</h3>
        <p className="text-sm text-muted-foreground">
          Upload candidate documents to get started
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {documents.map((document) => (
        <Card
          key={document.id}
          className="hover:bg-accent/50 transition-colors"
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="mt-1 text-muted-foreground">
                  {getFileIcon(document.mimeType)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium truncate">
                      {document.documentName}
                    </h4>
                    <Badge
                      variant={getDocumentTypeBadgeVariant(
                        document.documentType,
                      )}
                      className="shrink-0"
                    >
                      {document.documentType}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground truncate mb-1">
                    {document.originalFileName}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{formatFileSize(document.fileSize)}</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(document.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownload(document)}
                  title="Download document"
                >
                  <Download className="h-4 w-4" />
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={deleting === document.id}
                      title="Delete document"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Document</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{document.documentName}
                        "? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(document.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
