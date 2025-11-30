/** biome-ignore-all lint/suspicious/noArrayIndexKey: <> */
/** biome-ignore-all lint/suspicious/noExplicitAny: <> */
// biome-ignore-all lint/style/noNonNullAssertion: <>

"use client";
import { Dropzone, type FileWithMetadata } from "@/components/ui/dropzone";
import { useState } from "react";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { CheckCircle, PlusIcon, TagIcon, XIcon } from "lucide-react";
import { Checkbox } from "../ui/checkbox";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { uploadDocumentsAction } from "@/actions/documents/upload";
import { Progress } from "../ui/progress";
import { Spinner } from "../ui/spinner";

const statuses = [
  { label: "Active", value: "active" },
  { label: "Draft", value: "draft" },
  { label: "Archive", value: "archive" },
] as const;

const uploadSchema = z.object({
  title: z
    .string()
    .min(5, "Document title must be at least 5 characters.")
    .max(32, "Document title must be at most 32 characters."),
  description: z
    .string()
    .max(100, "Description must be at most 100 characters.")
    .optional(),
  folder: z.string().min(1, "Please select documents folder."),
  public: z.boolean(),
  departmental: z.boolean(),
  tags: z
    .array(
      z.object({
        name: z
          .string()
          .trim()
          .min(2, "Tag must have at least 2 characters.")
          .max(20, "Tag must not exceed 20 characters."),
      }),
    )
    .min(1, "Add at least one tag.")
    .max(10, "You can add up to 10 tags."),
  status: z.string().min(1, "Select status."),
  permissions: z
    .array(
      z.object({
        manage: z.boolean(),
        edit: z.boolean(),
        view: z.boolean(),
      }),
    )
    .min(1, "At least one permission entry is required.")
    .max(10, "You can define up to 10 permission sets."),
  shares: z
    .array(
      z.object({
        email: z.email("Enter a valid email address"),
        accessLevel: z.enum(["view", "edit", "manage"]),
      }),
    )
    .max(50, "You can share with up to 50 users.")
    .optional(),
});

export default function UploadDocumentButton({
  usersFolders,
  department,
}: {
  usersFolders: { name: string; path?: string }[];
  department: string;
}) {
  const router = useRouter();
  const [files, setFiles] = useState<FileWithMetadata[]>();
  const [newTag, setNewTag] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof uploadSchema>>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      title: "",
      description: "",
      folder: "personal",
      public: false,
      departmental: false,
      status: "active",
      tags: [{ name: "" }],
      permissions: [{ manage: false, edit: false, view: false }],
      shares: [],
    },
  });

  const {
    fields: tagFields,
    append: tagAppend,
    remove: tagRemove,
  } = useFieldArray({
    control: form.control,
    name: "tags",
  });

  const { fields: permissionsField, remove: permissionsRemove } = useFieldArray(
    {
      control: form.control,
      name: "permissions",
    },
  );

  const {
    fields: shareFields,
    append: shareAppend,
    remove: shareRemove,
  } = useFieldArray({
    control: form.control,
    name: "shares",
  });

  function handleAddTag() {
    const trimmed = newTag.trim();
    if (!trimmed) return;
    if (tagFields.length >= 10) {
      toast.error("You can only add up to 10 tags.");
      return;
    }

    if (tagFields.some((t) => t.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.error("Tag already exists.");
      return;
    }

    tagAppend({ name: trimmed });
    setNewTag("");
  }

  const folderWatch = form.watch("folder");

  const uploadFile = async (file: File): Promise<string | null | undefined> => {
    setFiles((prevFiles) =>
      prevFiles?.map((f) => (f.file === file ? { ...f, uploading: true } : f)),
    );

    setProgress(30);
    try {
      const endpoint = "/api/r2/upload";
      const presignedResponse = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          size: file.size,
        }),
      });

      setProgress(40);
      if (!presignedResponse.ok) {
        toast.error("Failed to get presigned URL");
        setFiles((prevFiles) =>
          prevFiles?.map((f) =>
            f.file === file
              ? { ...f, uploading: false, progress: 0, error: true }
              : f,
          ),
        );
        return null;
      }

      setProgress(50);
      const { presignedUrl, key, publicUrl } = await presignedResponse.json();

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        setProgress(70);
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = (event.loaded / event.total) * 100;
            setFiles((prevFiles) =>
              prevFiles?.map((f) =>
                f.file === file
                  ? {
                      ...f,
                      progress: Math.round(percentComplete),
                      key: key,
                      publicUrl: publicUrl,
                    }
                  : f,
              ),
            );
          }
        };

        setProgress(90);
        xhr.onload = () => {
          if (xhr.status === 200 || xhr.status === 204) {
            setFiles((prevFiles) =>
              prevFiles?.map((f) =>
                f.file === file
                  ? { ...f, progress: 100, uploading: false, error: false }
                  : f,
              ),
            );
            resolve();
          } else {
            reject(new Error(`Upload failed with status: ${xhr.status}`));
          }
        };

        xhr.onerror = () => {
          reject(new Error("Upload failed"));
        };

        xhr.open("PUT", presignedUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.send(file);
      });
      setProgress(100);
      const url = process.env.CLOUDFLARE_R2_PUBLIC_URL!;
      return publicUrl ?? `${url}/${encodeURIComponent(key)}`;
    } catch (error) {
      console.error(error);
      toast.error("Upload failed");
      setFiles((prevFiles) =>
        prevFiles?.map((f) =>
          f.file === file
            ? { ...f, uploading: false, progress: 0, error: true }
            : f,
        ),
      );
      return null;
    }
  };

  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  async function onSubmit(data: z.infer<typeof uploadSchema>) {
    setIsUploading(true);
    setProgress(0);

    try {
      if (!files || files?.length <= 0) {
        toast.error("No file selected");
        return;
      }

      setProgress(10);
      const uploadedUrls: {
        originalFileName: string;
        filePath: string;
        fileSize: string;
        mimeType: string;
      }[] = [];

      setProgress(20);
      for (const f of files) {
        const url = await uploadFile(f.file);
        const fileSizeMB = (f.file.size / (1024 * 1024)).toFixed(2);
        if (url)
          uploadedUrls.push({
            originalFileName: f.file.name,
            filePath: url,
            fileSize: fileSizeMB,
            mimeType: f.file.type,
          });
      }

      const payload: any = {
        title: data.title,
        folder: data.folder,
        permissions: data.permissions,
        tags: data.tags,
        status: data.status,
        public: data.public,
        departmental: data.departmental,
        description: data.description,
        Files: uploadedUrls,
        shares:
          (data as any).shares?.filter(
            (s: any) => s?.email && s?.accessLevel,
          ) ?? [],
      };
      const res = await uploadDocumentsAction(payload);
      if (res.success) {
        toast.success("Files uploaded succesfully");
        // Close dialog
        setDialogOpen(false);
        // Refresh the page to show new documents
        router.refresh();

        // Notify all dashboard components about the upload
        if (typeof window !== "undefined") {
          // Method 1: Storage event (works across tabs)
          window.localStorage.setItem(
            "document-uploaded",
            Date.now().toString(),
          );
          window.dispatchEvent(
            new StorageEvent("storage", {
              key: "document-uploaded",
              newValue: Date.now().toString(),
            }),
          );

          // Method 2: Custom event (works in same tab)
          window.dispatchEvent(
            new CustomEvent("document-uploaded", {
              detail: { timestamp: Date.now() },
            }),
          );

          console.log("[Upload Button] Dispatched document upload events");
        }
      } else {
        toast.error(res.error?.reason);
      }
    } catch (_error) {
      toast.error("Upload failed. Try again!");
    } finally {
      setIsUploading(false);
      form.reset();
    }
  }

  const safeFolders = [
    ...usersFolders,
    ...(usersFolders.some((f) => f.name.toLowerCase() === "general")
      ? []
      : [{ name: "public" }, { name: department }, { name: "personal" }]),
  ];

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button className="hover:cursor-pointer" size="lg">
          Upload Document
        </Button>
      </DialogTrigger>
      <DialogContent className="lg:min-w-5xl max-h-[35rem] overflow-y-scroll ">
        <DialogHeader>
          <DialogTitle>Document/File Upload</DialogTitle>
        </DialogHeader>
        <form id="form-upload-document" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <div className="grid gap-4 grid-cols-2 py-4">
              <Controller
                name="title"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldContent>
                      <FieldLabel htmlFor="title">Document Title *</FieldLabel>
                      <Input
                        {...field}
                        name="title"
                        aria-invalid={fieldState.invalid}
                        placeholder="2025 regional report"
                        autoComplete="off"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                      <FieldDescription>
                        Multiple docs will be prefixed with $name-number
                      </FieldDescription>
                    </FieldContent>
                  </Field>
                )}
              />

              <Controller
                name="folder"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field
                    orientation="responsive"
                    data-invalid={fieldState.invalid}
                  >
                    <FieldContent>
                      <FieldLabel htmlFor="folder">Folder *</FieldLabel>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                      <Select
                        name={field.name}
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger
                          name="folder"
                          aria-invalid={fieldState.invalid}
                          className="w-full"
                        >
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent position="item-aligned">
                          {[
                            ...new Map(
                              safeFolders.map((f) => [f.name.toLowerCase(), f]),
                            ).values(),
                          ].map((folder, idx) => (
                            <SelectItem key={idx} value={folder.name}>
                              {(folder.path ?? folder.name)
                                .charAt(0)
                                .toUpperCase() +
                                (folder.path ?? folder.name).slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldDescription>
                        Select folder to drop documents.
                      </FieldDescription>
                    </FieldContent>
                  </Field>
                )}
              />

              <Controller
                name="status"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field
                    orientation="responsive"
                    data-invalid={fieldState.invalid}
                  >
                    <FieldContent>
                      <FieldLabel htmlFor="status">Status *</FieldLabel>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                      <Select
                        name={field.name}
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger
                          name="status"
                          aria-invalid={fieldState.invalid}
                          className="w-full"
                        >
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent position="item-aligned">
                          {statuses.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldDescription>
                        Select Status for uploaded documents
                      </FieldDescription>
                    </FieldContent>
                  </Field>
                )}
              />

              <div>
                <FieldContent>
                  <FieldLabel>Tags *</FieldLabel>
                  {tagFields.map((field, index) => (
                    <Controller
                      key={field.id}
                      name={`tags.${index}.name`}
                      control={form.control}
                      render={({ field: controllerField, fieldState }) => (
                        <Field
                          orientation="horizontal"
                          data-invalid={fieldState.invalid}
                        >
                          <div className="w-full">
                            <InputGroup className="w-full mb-1">
                              <InputGroupAddon>
                                <TagIcon className="h-4 w-4 text-muted-foreground" />
                              </InputGroupAddon>
                              <InputGroupInput
                                {...controllerField}
                                id={`tag-${index}`}
                                placeholder="Enter tag name"
                                aria-invalid={fieldState.invalid}
                                autoComplete="off"
                              />
                              {tagFields.length > 1 && (
                                <InputGroupAddon align="inline-end">
                                  <InputGroupButton
                                    type="button"
                                    variant="ghost"
                                    size="icon-xs"
                                    onClick={() => tagRemove(index)}
                                    aria-label={`Remove tag ${index + 1}`}
                                  >
                                    <XIcon />
                                  </InputGroupButton>
                                </InputGroupAddon>
                              )}
                            </InputGroup>
                            {fieldState.invalid && (
                              <FieldError errors={[fieldState.error]} />
                            )}
                          </div>
                        </Field>
                      )}
                    />
                  ))}

                  {form.formState.errors.tags?.root && (
                    <FieldError errors={[form.formState.errors.tags.root]} />
                  )}
                </FieldContent>

                <div className="flex gap-2 mt-2">
                  <InputGroup className="flex-1">
                    <InputGroupInput
                      placeholder="New tag name..."
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                    />
                    <InputGroupAddon align="inline-end">
                      <InputGroupButton
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={handleAddTag}
                        disabled={!newTag.trim() || tagFields.length >= 10}
                      >
                        <PlusIcon />
                      </InputGroupButton>
                    </InputGroupAddon>
                  </InputGroup>
                </div>
              </div>

              <div>
                <FieldContent>
                  <FieldLabel>Options</FieldLabel>

                  <Controller
                    name="public"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <FieldSet data-invalid={fieldState.invalid}>
                        <FieldGroup data-slot="checkbox-group">
                          <Field orientation="horizontal">
                            <Checkbox
                              name={field.name}
                              disabled={folderWatch === "personal"}
                              onCheckedChange={field.onChange}
                            />
                            <FieldLabel
                              htmlFor="public"
                              className="font-normal"
                            >
                              Public (Documents accessible to all employees)
                            </FieldLabel>
                          </Field>
                        </FieldGroup>

                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </FieldSet>
                    )}
                  />

                  <Controller
                    name="departmental"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <FieldSet data-invalid={fieldState.invalid}>
                        <FieldGroup data-slot="checkbox-group">
                          <Field orientation="horizontal">
                            <Checkbox
                              name={field.name}
                              disabled={folderWatch === "personal"}
                              onCheckedChange={field.onChange}
                            />
                            <FieldLabel
                              htmlFor="public"
                              className="font-normal"
                            >
                              Department (Documents accessible to {department}{" "}
                              employees)
                            </FieldLabel>
                          </Field>
                        </FieldGroup>

                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </FieldSet>
                    )}
                  />

                  <FieldDescription>
                    Select options that apply to upload
                  </FieldDescription>
                </FieldContent>
              </div>
              <div className="gap-3">
                <FieldLabel>
                  Configure permissions / Uploader has all permissions *
                </FieldLabel>
                {permissionsField.map((field, index) => (
                  <div
                    key={field.id}
                    className="flex items-center justify-between gap-4 border rounded-md p-3"
                  >
                    <div className="flex flex-col gap-2 flex-1">
                      <Controller
                        name={`permissions.${index}.manage`}
                        control={form.control}
                        render={({ field: controllerField }) => (
                          <div className="flex items-center justify-between">
                            <Label htmlFor={`all-${index}`}>
                              Manage (can update permissions)
                            </Label>
                            <Switch
                              id={`all-${index}`}
                              disabled={folderWatch === "personal"}
                              checked={controllerField.value}
                              onCheckedChange={controllerField.onChange}
                            />
                          </div>
                        )}
                      />

                      <Controller
                        name={`permissions.${index}.edit`}
                        control={form.control}
                        render={({ field: controllerField }) => (
                          <div className="flex items-center justify-between">
                            <Label htmlFor={`dept-all-${index}`}>
                              Edit (can edit uploaded documents)
                            </Label>
                            <Switch
                              id={`dept-all-${index}`}
                              disabled={folderWatch === "personal"}
                              checked={controllerField.value}
                              onCheckedChange={controllerField.onChange}
                            />
                          </div>
                        )}
                      />

                      <Controller
                        name={`permissions.${index}.view`}
                        control={form.control}
                        render={({ field: controllerField }) => (
                          <div className="flex items-center justify-between">
                            <Label htmlFor={`dept-${index}`}>
                              View (can view and download documents)
                            </Label>
                            <Switch
                              id={`dept-${index}`}
                              disabled={folderWatch === "personal"}
                              checked={controllerField.value}
                              onCheckedChange={controllerField.onChange}
                            />
                          </div>
                        )}
                      />
                    </div>

                    {permissionsField.length > 1 && (
                      <InputGroupAddon align="inline-end">
                        <InputGroupButton
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => permissionsRemove(index)}
                          aria-label={`Remove permission ${index + 1}`}
                        >
                          <XIcon />
                        </InputGroupButton>
                      </InputGroupAddon>
                    )}
                  </div>
                ))}

                {form.formState.errors.permissions?.root && (
                  <FieldError
                    errors={[form.formState.errors.permissions.root]}
                  />
                )}
              </div>

              <div className="gap-3">
                <FieldLabel>Share with specific users</FieldLabel>
                {shareFields.length === 0 && (
                  <FieldDescription>
                    Add people by email and set access level.
                  </FieldDescription>
                )}
                {shareFields.map((field, index) => (
                  <div
                    key={field.id}
                    className="flex items-center justify-between gap-4 border rounded-md p-3"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <Controller
                        name={`shares.${index}.email`}
                        control={form.control}
                        render={({ field: controllerField, fieldState }) => (
                          <Field
                            orientation="horizontal"
                            data-invalid={fieldState.invalid}
                            className="flex-1"
                          >
                            <Input
                              {...controllerField}
                              id={`share-email-${index}`}
                              type="email"
                              placeholder="user@example.com"
                              aria-invalid={fieldState.invalid}
                              autoComplete="off"
                            />
                            {fieldState.invalid && (
                              <FieldError errors={[fieldState.error]} />
                            )}
                          </Field>
                        )}
                      />
                      <Controller
                        name={`shares.${index}.accessLevel`}
                        control={form.control}
                        render={({ field: controllerField }) => (
                          <Select
                            value={controllerField.value}
                            onValueChange={controllerField.onChange}
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue placeholder="Access" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="view">View</SelectItem>
                              <SelectItem value="edit">Edit</SelectItem>
                              <SelectItem value="manage">Manage</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => shareRemove(index)}
                      aria-label={`Remove share ${index + 1}`}
                    >
                      <XIcon />
                    </Button>
                  </div>
                ))}
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      shareAppend({ email: "", accessLevel: "view" })
                    }
                  >
                    <PlusIcon className="mr-2 h-4 w-4" />
                    Add user
                  </Button>
                </div>
              </div>

              <div className="col-span-2">
                <Controller
                  name="description"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="description">Description</FieldLabel>
                      <InputGroup>
                        <InputGroupTextarea
                          {...field}
                          name="description"
                          placeholder="All documents in relation to the northen states"
                          rows={6}
                          className="min-h-24 resize-none"
                          aria-invalid={fieldState.invalid}
                        />
                        <InputGroupAddon align="block-end">
                          <InputGroupText className="tabular-nums">
                            {field.value?.length}/100 characters
                          </InputGroupText>
                        </InputGroupAddon>
                      </InputGroup>
                      <FieldDescription>
                        Include steps to reproduce, expected behavior, and what
                        actually happened.
                      </FieldDescription>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </div>
            </div>
          </FieldGroup>

          <Dropzone
            provider="cloudflare-r2"
            variant="compact"
            maxFiles={10}
            maxSize={1024 * 1024 * 50} // 50MB
            onFilesChange={(files) => setFiles(files)}
          />
          <div>
            <Field orientation="horizontal">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                }}
              >
                Reset
              </Button>
              <Button
                type="submit"
                disabled={isUploading}
                form="form-upload-document"
              >
                {isUploading && <Spinner />}
                {!isUploading ? "Submit" : "Uploading..."}
              </Button>
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {progress < 100
                        ? "Uploading document.pdf..."
                        : "Upload complete!"}
                    </span>
                    <span className="font-medium">{progress}%</span>
                  </div>
                  <Progress value={progress} className="w-full" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    {progress > 100 && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                </div>
              )}
            </Field>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
