"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { uploadFileToR2 } from "@/lib/utils/upload";
import {
  uploadOrganizationLogo,
  removeOrganizationLogo,
} from "@/actions/branding";
import { validateLogoFile } from "@/lib/validations/branding";

interface LogoUploadProps {
  organizationId: string;
  currentLogoUrl?: string | null;
  onUploadComplete?: (logoUrl: string) => void;
}

export function LogoUpload({
  organizationId,
  currentLogoUrl,
  onUploadComplete,
}: LogoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(currentLogoUrl || null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation
    const validation = validateLogoFile(file);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    // Preview
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    // Upload
    setUploading(true);
    setProgress(0);

    try {
      const result = await uploadFileToR2(file, setProgress);
      if (!result) {
        toast.error("Upload failed");
        return;
      }

      // Save to database
      const saveResult = await uploadOrganizationLogo(
        organizationId,
        result.url,
      );
      if (!saveResult.success) {
        toast.error(saveResult.error || "Failed to save logo");
        return;
      }

      toast.success("Logo uploaded successfully");
      onUploadComplete?.(result.url);
    } catch (error) {
      console.error(error);
      toast.error("Upload failed");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }

  async function handleRemove() {
    if (!confirm("Are you sure you want to remove the organization logo?")) {
      return;
    }

    const result = await removeOrganizationLogo(organizationId);
    if (result.success) {
      setPreview(null);
      toast.success("Logo removed successfully");
      onUploadComplete?.("");
    } else {
      toast.error(result.error || "Failed to remove logo");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        {preview && (
          <div className="relative">
            <img
              src={preview}
              alt="Organization logo preview"
              className="h-16 w-16 object-contain border rounded"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6"
              onClick={handleRemove}
              disabled={uploading}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}
        <div className="flex-1">
          <Input
            type="file"
            accept=".png,.jpg,.jpeg,.svg"
            onChange={handleFileChange}
            disabled={uploading}
          />
          <p className="text-sm text-muted-foreground mt-1">
            PNG, JPG, or SVG. Max 2MB.
          </p>
        </div>
      </div>

      {uploading && (
        <div className="space-y-2">
          <Progress value={progress} />
          <p className="text-sm text-muted-foreground">{progress}% uploaded</p>
        </div>
      )}
    </div>
  );
}
