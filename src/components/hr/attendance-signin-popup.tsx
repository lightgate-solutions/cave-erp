"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { signIn } from "@/actions/hr/attendance";
import { useAttendancePopup } from "@/hooks/use-attendance-popup";
import {
  dismissPopupForToday,
  snoozePopup,
  getSnoozeRemainingMinutes,
} from "@/lib/attendance-utils";

interface AttendanceSignInPopupProps {
  currentEmployeeId: number;
  hasSignedInToday: boolean;
  isLoading?: boolean;
}

export function AttendanceSignInPopup({
  currentEmployeeId,
  hasSignedInToday,
  isLoading = false,
}: AttendanceSignInPopupProps) {
  const queryClient = useQueryClient();
  const [snoozeMinutes, _setSnoozeMinutes] = useState(30);

  const { isOpen, canSignIn, timeWindowMessage, closePopup } =
    useAttendancePopup({
      hasSignedInToday,
      isLoading,
    });

  // Sign-in mutation
  const signInMutation = useMutation({
    mutationFn: signIn,
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error.reason);
      } else {
        toast.success(res.success?.reason || "Successfully signed in!");
        // Invalidate queries to refresh attendance data
        queryClient.invalidateQueries({ queryKey: ["myAttendance"] });
        queryClient.invalidateQueries({ queryKey: ["allAttendance"] });
        // Close popup after successful sign-in
        closePopup();
      }
    },
    onError: () => {
      toast.error("Failed to sign in. Please try again.");
    },
  });

  const handleSignIn = () => {
    signInMutation.mutate(currentEmployeeId);
  };

  const handleSnooze = () => {
    snoozePopup();
    const remaining = getSnoozeRemainingMinutes();
    toast.info(`Reminder snoozed for ${remaining} minutes`);
    closePopup();
  };

  const handleDismiss = () => {
    dismissPopupForToday();
    toast.info("You won't be reminded again today");
    closePopup();
  };

  // Don't render if not open
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={closePopup}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            Attendance Sign-In
          </DialogTitle>
          <DialogDescription>
            {hasSignedInToday
              ? "You have already signed in today"
              : "You haven't signed in for today yet"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Status Section */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">Today's Status</p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(), "EEEE, MMMM d, yyyy")}
              </p>
            </div>
            <Badge
              variant={hasSignedInToday ? "default" : "secondary"}
              className="ml-4"
            >
              {hasSignedInToday ? (
                <>
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Signed In
                </>
              ) : (
                <>
                  <AlertCircle className="mr-1 h-3 w-3" />
                  Not Signed In
                </>
              )}
            </Badge>
          </div>

          {/* Time Window Message */}
          <div
            className={`flex items-start gap-3 rounded-lg border p-4 ${
              canSignIn
                ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950"
                : "border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950"
            }`}
          >
            <Clock
              className={`h-5 w-5 ${canSignIn ? "text-green-600 dark:text-green-400" : "text-yellow-600 dark:text-yellow-400"}`}
            />
            <div>
              <p className="text-sm font-medium">{timeWindowMessage}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {canSignIn
                  ? "You can sign in now (6:00 AM - 9:00 AM)"
                  : "Sign-in is only available between 6:00 AM and 9:00 AM"}
              </p>
            </div>
          </div>

          {/* Helper Text */}
          {!hasSignedInToday && !canSignIn && (
            <p className="text-xs text-muted-foreground">
              The sign-in button will be enabled when the time window opens. You
              can dismiss this reminder or set a snooze.
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-between">
            {/* Left side buttons */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDismiss}
              >
                Dismiss
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleSnooze}
              >
                Remind in {snoozeMinutes}m
              </Button>
            </div>

            {/* Right side button */}
            <Button
              onClick={handleSignIn}
              disabled={
                !canSignIn || hasSignedInToday || signInMutation.isPending
              }
              className="sm:ml-auto"
            >
              {signInMutation.isPending
                ? "Signing In..."
                : hasSignedInToday
                  ? "Already Signed In"
                  : "Sign In Now"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
