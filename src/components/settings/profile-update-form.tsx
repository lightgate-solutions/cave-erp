"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { LoadingSwap } from "../ui/loading-swap";
import { Skeleton } from "../ui/skeleton";

const profileUpdateForm = z.object({
  email: z.email({ message: "Email is required" }).min(1, "Email is required"),
  name: z.string().min(1, "Name is required"),
});

type ProfileUpdateForm = z.infer<typeof profileUpdateForm>;

export function ProfileUpdateForm({
  user,
}: {
  user:
    | { email: string; name: string; emailVerified: boolean }
    | undefined
    | null;
}) {
  const router = useRouter();

  const form = useForm<ProfileUpdateForm>({
    resolver: zodResolver(profileUpdateForm),
    defaultValues: user || undefined, // Set defaultValues to undefined if user is null
  });
  const { isSubmitting } = form.formState;

  async function onSubmit(data: ProfileUpdateForm) {
    if (!user) return; // Should not happen if skeleton is shown

    const promises = [
      authClient.updateUser({
        name: data.name,
      }),
    ];

    if (data.email !== user.email) {
      promises.push(
        authClient.changeEmail({
          newEmail: data.email,
          callbackURL: "/settings",
        }),
      );
    }

    const res = await Promise.all(promises);

    const updateUserResult = res[0];
    const emailResult = res[1] ?? { error: false };

    if (updateUserResult.error) {
      toast.error(updateUserResult.error.message || "Failed to update profile");
    } else if (emailResult.error) {
      toast.error(emailResult.error.message || "Failed to change email");
    } else {
      if (data.email !== user.email) {
        toast.success("Verify your new email address to complete the change.");
      } else {
        toast.success("Profile updated successfully");
      }
      router.refresh();
    }
  }

  if (!user) {
    return <ProfileUpdateFormSkeleton />;
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle>Update User Profile</CardTitle>
        <CardDescription>Get started with CAVE in minutes</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form
          id="update-profile-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <FieldGroup>
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="update-user-name">Full Name</FieldLabel>
                  <Input
                    {...field}
                    id="update-user-name"
                    aria-invalid={fieldState.invalid}
                    placeholder="John Mary"
                    type="text"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="update-user-email">Email</FieldLabel>
                  <Input
                    {...field}
                    id="update-user-email"
                    aria-invalid={fieldState.invalid}
                    placeholder="abc@ventures.com.ng"
                    autoComplete="email"
                    type="email"
                  />
                  <FieldDescription>
                    This is your active email address
                  </FieldDescription>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
      </CardContent>

      <CardFooter className="flex flex-col space-y-4">
        <Button
          type="submit"
          form="update-profile-form"
          className="w-full hover:cursor-pointer"
          disabled={isSubmitting}
        >
          <LoadingSwap isLoading={isSubmitting}>Update User</LoadingSwap>
        </Button>
      </CardFooter>
    </Card>
  );
}

function ProfileUpdateFormSkeleton() {
  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle>
          <Skeleton className="h-8 w-48" />
        </CardTitle>
        <CardDescription>
          <Skeleton className="h-4 w-64" />
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <FieldGroup>
            <Field>
              <FieldLabel>
                <Skeleton className="h-4 w-24" />
              </FieldLabel>
              <Skeleton className="h-10 w-full" />
            </Field>
            <Field>
              <FieldLabel>
                <Skeleton className="h-4 w-24" />
              </FieldLabel>
              <Skeleton className="h-10 w-full" />
              <FieldDescription>
                <Skeleton className="h-4 w-48" />
              </FieldDescription>
            </Field>
          </FieldGroup>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        <Skeleton className="h-10 w-full" />
      </CardFooter>
    </Card>
  );
}
