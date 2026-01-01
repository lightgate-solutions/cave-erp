/** biome-ignore-all lint/suspicious/noArrayIndexKey: <> */
/** biome-ignore-all lint/style/noNonNullAssertion: <> */
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronsUpDown, Mountain, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "../ui/field";
import { Input } from "../ui/input";
import { LoadingSwap } from "../ui/loading-swap";

type CreateOrganizationForm = z.infer<typeof createOrganizationSchema>;

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export function OrganizationSwitcher({
  size = "md",
  showText = true,
}: LogoProps) {
  const { data: organizations, isPending: orgPending } =
    authClient.useListOrganizations();

  const { data: userData, isPending: userPending } = authClient.useSession();

  if (userPending || orgPending)
    return (
      <div className="h-10 animate-pulse bg-primary  w-full hover:cursor-pointer"></div>
    );

  if (!userData?.user.id) return null;

  if (organizations == null || organizations.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center w-full gap-2">
      {showText && (
        <Switcher
          size={size}
          organizations={organizations}
          userId={userData.user.id}
        />
      )}
    </div>
  );
}

const createOrganizationSchema = z.object({
  name: z.string().min(1, "Valid Organization Name is Required"),
});

function Switcher({
  organizations,
  size,
  userId,
}: {
  size: string;
  userId: string;
  organizations: {
    id: string;
    name: string;
    slug: string;
  }[];
}) {
  const { data: activeOrganization, isPending: orgPending } =
    authClient.useActiveOrganization();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const form = useForm<CreateOrganizationForm>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: {
      name: "",
    },
  });

  const { data: userData, isPending: userPending } = authClient.useSession();

  if (orgPending)
    return (
      <div className="h-10 animate-pulse bg-primary  w-full hover:cursor-pointer"></div>
    );

  if (userPending)
    return (
      <p className="flex justify-center items-center w-full h-full ">
        Loading...
      </p>
    );

  const { isSubmitting } = form.formState;

  async function handleCreateOrganization(data: CreateOrganizationForm) {
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
      ownerId: userId,
    });

    if (res.error) {
      toast.error(res.error.message || "Failed to create organization");
    } else {
      form.reset();

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
      setOpen(false);
      await authClient.organization.setActive({ organizationId: res.data.id });
    }
  }

  function setActiveOrganization(organizationId: string) {
    authClient.organization.setActive(
      { organizationId },
      {
        onError: (error) => {
          toast.error(error.error.message || "Failed to switch organization");
        },
        onSuccess: () => {
          router.refresh();
          if (typeof window !== "undefined") {
            window.dispatchEvent(new Event("organization:changed"));
          }
        },
      },
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="lg"
          className="data-[state=open]:bg-sidebar-accent w-full hover:cursor-pointer data-[state=open]:text-sidebar-accent-foreground"
        >
          <Mountain
            className={`${size === "lg" ? "h-7 w-7" : size === "md" ? "h-5 w-5" : "h-4 w-4"} text-primary-foreground`}
          />
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">
              {activeOrganization?.name}
            </span>
          </div>
          <ChevronsUpDown className="ml-auto" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
        align="start"
        sideOffset={4}
      >
        <DropdownMenuLabel className="text-muted-foreground text-xs">
          Organizations
        </DropdownMenuLabel>
        {organizations.map((org, index) => (
          <DropdownMenuItem
            key={index}
            onClick={() => {
              setActiveOrganization(org.id);
              router.refresh;
            }}
            className="gap-2 p-2"
          >
            {org.name}
            {org.id === activeOrganization?.id && <Check />}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        <DropdownMenuItem className="gap-2 p-2" asChild>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="hover:cursor-pointer w-full" variant="ghost">
                <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                  <Plus className="size-4" />
                </div>
                <div className="text-muted-foreground font-medium">
                  Add Organization
                </div>
              </Button>
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
                        <FieldLabel htmlFor="org-name">
                          Organization Name
                        </FieldLabel>
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
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
