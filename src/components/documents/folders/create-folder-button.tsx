/** biome-ignore-all lint/suspicious/noArrayIndexKey: <> */
// biome-ignore-all lint/style/noNonNullAssertion: <>

"use client";
import { useState } from "react";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/spinner";
import { createFolder } from "@/actions/documents/folders";
import { usePathname } from "next/navigation";

/** Radix Select must not use "" as a value; maps to no parent on the server. */
const ROOT_PARENT_SELECT_VALUE = "__documents_root__";

const nestedFolderSchema = z.object({
  name: z
    .string()
    .min(3, "Folder name must be at least 3 characters.")
    .max(32, "Folder name must be at most 32 characters."),
  public: z.boolean(),
  departmental: z.boolean(),
});

const rootFolderSchema = nestedFolderSchema.extend({
  parent: z.string(),
});

export default function CreateFolderButton({
  usersFolders,
  department,
  lockedParentFolderId,
  lockedParentFolderHint,
}: {
  usersFolders: { name: string }[];
  department: string;
  lockedParentFolderId?: number;
  lockedParentFolderHint?: string | null;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const pathname = usePathname();

  const isNested = lockedParentFolderId != null;

  const form = useForm<
    z.infer<typeof nestedFolderSchema> & { parent?: string }
  >({
    resolver: zodResolver(isNested ? nestedFolderSchema : rootFolderSchema),
    defaultValues: {
      name: "",
      parent: ROOT_PARENT_SELECT_VALUE,
      public: false,
      departmental: false,
    },
  });

  async function onSubmit(
    data: z.infer<typeof nestedFolderSchema> & { parent?: string },
  ) {
    setIsSubmitting(true);
    try {
      const res = await createFolder(
        {
          name: data.name,
          ...(isNested
            ? { parentId: lockedParentFolderId }
            : {
                parent:
                  data.parent === ROOT_PARENT_SELECT_VALUE
                    ? ""
                    : (data.parent ?? ""),
              }),
          public: data.public,
          departmental: data.departmental,
        },
        pathname,
      );
      if (res.success) {
        toast.success("Folder created succesfully");
        form.reset();
        setDialogOpen(false);
      } else {
        toast.error(res.error?.reason);
      }
    } catch (_error) {
      toast.error("folder creation failed. Try again!");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <form id="form-create-folder" onSubmit={form.handleSubmit(onSubmit)}>
        <DialogTrigger asChild>
          <Button
            variant="secondary"
            className="hover:cursor-pointer w-full"
            size="lg"
          >
            Create Folder
          </Button>
        </DialogTrigger>
        <DialogContent className="lg:min-w-5xl max-h-[35rem] overflow-y-scroll ">
          <DialogHeader>
            <DialogTitle>Create Folder</DialogTitle>
          </DialogHeader>

          <FieldGroup>
            <div className="grid gap-4 grid-cols-2 py-4">
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldContent>
                      <FieldLabel htmlFor="title">Folder Name *</FieldLabel>
                      <Input
                        {...field}
                        name="title"
                        aria-invalid={fieldState.invalid}
                        placeholder="Financial Report"
                        autoComplete="off"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                      <FieldDescription>Name of the folder</FieldDescription>
                    </FieldContent>
                  </Field>
                )}
              />

              {!isNested ? (
                <Controller
                  name="parent"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field
                      orientation="responsive"
                      data-invalid={fieldState.invalid}
                    >
                      <FieldContent>
                        <FieldLabel htmlFor="status">
                          Parent Folder (if any)
                        </FieldLabel>
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
                            <SelectValue placeholder="Root (no parent)" />
                          </SelectTrigger>
                          <SelectContent position="item-aligned">
                            <SelectItem value={ROOT_PARENT_SELECT_VALUE}>
                              Root (no parent)
                            </SelectItem>
                            {usersFolders.map((folder, idx) => (
                              <SelectItem key={idx} value={folder.name}>
                                {folder.name.charAt(0).toUpperCase() +
                                  folder.name.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FieldDescription>
                          Select parent folder for nested folders
                        </FieldDescription>
                      </FieldContent>
                    </Field>
                  )}
                />
              ) : (
                <Field orientation="responsive">
                  <FieldContent>
                    <FieldLabel>Location</FieldLabel>
                    <p className="text-sm text-muted-foreground rounded-md border border-border bg-muted/40 px-3 py-2">
                      {lockedParentFolderHint
                        ? `Creating inside: ${lockedParentFolderHint}`
                        : "Creating inside the current folder"}
                    </p>
                    <FieldDescription>
                      Parent folder is set from where you are in Documents
                    </FieldDescription>
                  </FieldContent>
                </Field>
              )}

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
                              id="create-folder-public"
                              name={field.name}
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                            <FieldLabel
                              htmlFor="create-folder-public"
                              className="font-normal"
                            >
                              Public (Folders are only public when their parent
                              folder is set to public)
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
                          <Field
                            orientation="horizontal"
                            className="items-start"
                          >
                            <Checkbox
                              id="create-folder-departmental"
                              name={field.name}
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="mt-1"
                            />
                            <div className="grid gap-1">
                              <FieldLabel
                                htmlFor="create-folder-departmental"
                                className="font-normal leading-snug"
                              >
                                Department folder ({department})
                              </FieldLabel>
                              <FieldDescription>
                                Marks this folder as belonging to your HR
                                department ({department}). Other active
                                employees in the same department can see it in
                                Documents alongside their own folders, like a
                                shared team space. Leave this off if the folder
                                should stay private to you (and anyone you grant
                                access to later).
                              </FieldDescription>
                            </div>
                          </Field>
                        </FieldGroup>

                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </FieldSet>
                    )}
                  />

                  <FieldDescription>
                    These options control who can see this folder in the
                    document library, not uploads themselves.
                  </FieldDescription>
                </FieldContent>
              </div>
            </div>
          </FieldGroup>

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
                disabled={isSubmitting}
                form="form-create-folder"
                className="hover:cursor-pointer"
              >
                {isSubmitting && <Spinner />}
                {!isSubmitting ? "Create" : "Creating..."}
              </Button>
            </Field>
          </div>
        </DialogContent>
      </form>
    </Dialog>
  );
}
