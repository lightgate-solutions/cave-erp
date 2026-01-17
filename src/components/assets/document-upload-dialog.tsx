/** biome-ignore-all lint/a11y/noStaticElementInteractions: <> */
/** biome-ignore-all lint/a11y/useKeyWithClickEvents: <> */

"use client";

import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, File, X } from "lucide-react";
import { toast } from "sonner";

interface DocumentUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assetId: number;
}

const DOCUMENT_TYPES = [
  { value: "Receipt", label: "Receipt" },
  { value: "Invoice", label: "Invoice" },
  { value: "Warranty", label: "Warranty Document" },
  { value: "Photos", label: "Photos" },
  { value: "Manual", label: "Manual" },
  { value: "Maintenance Record", label: "Maintenance Record" },
  { value: "Inspection Report", label: "Inspection Report" },
  { value: "Disposal Certificate", label: "Disposal Certificate" },
  { value: "Other", label: "Other" },
];

export function DocumentUploadDialog({
  open,
  onOpenChange,
  assetId,
}: DocumentUploadDialogProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    documentType: "",
    documentName: "",
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!formData.documentName) {
        setFormData((prev) => ({ ...prev, documentName: file.name }));
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!formData.documentName) {
        setFormData((prev) => ({ ...prev, documentName: file.name }));
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      toast.error("Please select a file to upload");
      return;
    }

    if (!formData.documentType) {
      toast.error("Please select a document type");
      return;
    }

    setIsLoading(true);

    try {
      const uploadData = new FormData();
      uploadData.append("file", selectedFile);
      uploadData.append("documentType", formData.documentType);
      uploadData.append(
        "documentName",
        formData.documentName || selectedFile.name,
      );

      const response = await fetch(`/api/assets/${assetId}/documents`, {
        method: "POST",
        body: uploadData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to upload document");
      }

      toast.success("Document uploaded successfully");
      queryClient.invalidateQueries({ queryKey: ["asset-documents", assetId] });
      onOpenChange(false);
      setSelectedFile(null);
      setFormData({ documentType: "", documentName: "" });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to upload document",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            Attach a document to this asset (receipt, invoice, warranty, etc.)
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* File Drop Zone */}
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                selectedFile
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-primary/50"
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp"
              />

              {selectedFile ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <File className="h-8 w-8 text-primary" />
                    <div className="text-left">
                      <p className="font-medium truncate max-w-[250px]">
                        {selectedFile.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      clearFile();
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PDF, DOC, XLS, JPG, PNG up to 10MB
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="documentType">Document Type *</Label>
              <Select
                value={formData.documentType}
                onValueChange={(value) =>
                  setFormData({ ...formData, documentType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="documentName">Document Name</Label>
              <Input
                id="documentName"
                value={formData.documentName}
                onChange={(e) =>
                  setFormData({ ...formData, documentName: e.target.value })
                }
                placeholder="Enter a name for this document"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !selectedFile}>
              {isLoading ? "Uploading..." : "Upload"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
