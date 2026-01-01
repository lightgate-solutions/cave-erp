/** biome-ignore-all lint/style/noNonNullAssertion: <> */

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { authClient } from "@/lib/auth-client";
import { Field, FieldError, FieldGroup, FieldLabel } from "../ui/field";

const createOrganizationSchema = z.object({
  name: z.string().min(1, "Valid Organization Name is Required"),
});

type CreateOrganizationForm = z.infer<typeof createOrganizationSchema>;

export function CreateOrganizationButton() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const form = useForm<CreateOrganizationForm>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: {
      name: "",
    },
  });
  const { data: userData, isPending: userPending } = authClient.useSession();

  if (userPending)
    return (
      <p className="flex justify-center items-center w-full h-full ">
        Loading...
      </p>
    );

  if (!userData?.user.id) return null;

  const { isSubmitting } = form.formState;

  async function handleCreateOrganization(data: CreateOrganizationForm) {
    // Validate organization creation limit
    const { validateOrganizationCreation } = await import(
      "@/actions/organizations"
    );
    const validation = await validateOrganizationCreation();

    if (!validation.canCreate) {
      toast.error(validation.error || "Cannot create organization");
      return;
    }

    const slug = data.name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-");
    const res = await authClient.organization.create({
      name: data.name,
      slug,
      ownerId: userData!.user!.id,
    });

    if (res.error) {
      toast.error(res.error.message || "Failed to create organization");
    } else {
      form.reset();
      setOpen(false);
      await authClient.organization.setActive({ organizationId: res.data.id });

      // Create employee record for the organization owner
      const { createEmployee } = await import("@/actions/hr/employees");
      await createEmployee({
        name: userData!.user!.name,
        email: userData!.user!.email,
        authId: userData!.user!.id,
        role: "admin",
        isManager: true,
        data: {
          department: "admin",
        },
      });

      toast.success("Organization created successfully!");
      setTimeout(() => {
        router.refresh();
      }, 1500);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="hover:cursor-pointer">Create Organization</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Organization</DialogTitle>
          <DialogDescription>
            Create a new organization to manage your business data
          </DialogDescription>
        </DialogHeader>

        <form
          id="create-org-form"
          onSubmit={form.handleSubmit(handleCreateOrganization)}
          className="space-y-4"
        >
          <FieldGroup>
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="org-name">Organization Name</FieldLabel>
                  <Input {...field} type="text" name="organization" />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
        <DialogFooter className="grid w-full">
          <Button
            type="button"
            variant="outline"
            className="hover:cursor-pointer"
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            form="create-org-form"
            type="submit"
            disabled={isSubmitting}
            className="w-full hover:cursor-pointer"
          >
            <LoadingSwap isLoading={isSubmitting}>Create</LoadingSwap>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
