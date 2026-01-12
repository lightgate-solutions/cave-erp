"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateAttendanceSettings } from "@/actions/hr/attendance";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface AttendanceSettingsClientProps {
  settings: {
    signInStartHour: number;
    signInEndHour: number;
    signOutStartHour: number;
    signOutEndHour: number;
  };
}

export default function AttendanceSettingsClient({
  settings: initialSettings,
}: AttendanceSettingsClientProps) {
  const router = useRouter();
  const [signInStartHour, setSignInStartHour] = useState(
    initialSettings.signInStartHour,
  );
  const [signInEndHour, setSignInEndHour] = useState(
    initialSettings.signInEndHour,
  );
  const [signOutStartHour, setSignOutStartHour] = useState(
    initialSettings.signOutStartHour,
  );
  const [signOutEndHour, setSignOutEndHour] = useState(
    initialSettings.signOutEndHour,
  );

  const updateMutation = useMutation({
    mutationFn: (settings: {
      signInStartHour: number;
      signInEndHour: number;
      signOutStartHour: number;
      signOutEndHour: number;
    }) => updateAttendanceSettings(settings),
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error.reason);
      } else {
        toast.success(res.success?.reason);
        router.refresh();
      }
    },
    onError: () => toast.error("Failed to update settings"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    if (signInStartHour >= signInEndHour) {
      toast.error("Sign-in start hour must be before end hour");
      return;
    }
    if (signOutStartHour >= signOutEndHour) {
      toast.error("Sign-out start hour must be before end hour");
      return;
    }

    updateMutation.mutate({
      signInStartHour,
      signInEndHour,
      signOutStartHour,
      signOutEndHour,
    });
  };

  const formatHour = (hour: number) => {
    return `${hour.toString().padStart(2, "0")}:00`;
  };

  // Generate hour options (0-23)
  const hourOptions = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="space-y-4">
      <Link href="/hr/attendance">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Attendance
        </Button>
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Configure Attendance Time Windows</CardTitle>
          <CardDescription>
            Set the allowed time windows for employees to sign in and sign out.
            All times are in 24-hour format.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Sign In Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Sign In Window</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="signInStartHour">Start Hour</Label>
                  <Select
                    value={signInStartHour.toString()}
                    onValueChange={(value) =>
                      setSignInStartHour(Number.parseInt(value))
                    }
                  >
                    <SelectTrigger id="signInStartHour">
                      <SelectValue placeholder="Select hour" />
                    </SelectTrigger>
                    <SelectContent>
                      {hourOptions.map((hour) => (
                        <SelectItem key={hour} value={hour.toString()}>
                          {formatHour(hour)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signInEndHour">End Hour</Label>
                  <Select
                    value={signInEndHour.toString()}
                    onValueChange={(value) =>
                      setSignInEndHour(Number.parseInt(value))
                    }
                  >
                    <SelectTrigger id="signInEndHour">
                      <SelectValue placeholder="Select hour" />
                    </SelectTrigger>
                    <SelectContent>
                      {hourOptions.map((hour) => (
                        <SelectItem key={hour} value={hour.toString()}>
                          {formatHour(hour)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Current window: {formatHour(signInStartHour)} -{" "}
                {formatHour(signInEndHour)}
              </p>
            </div>

            {/* Sign Out Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Sign Out Window</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="signOutStartHour">Start Hour</Label>
                  <Select
                    value={signOutStartHour.toString()}
                    onValueChange={(value) =>
                      setSignOutStartHour(Number.parseInt(value))
                    }
                  >
                    <SelectTrigger id="signOutStartHour">
                      <SelectValue placeholder="Select hour" />
                    </SelectTrigger>
                    <SelectContent>
                      {hourOptions.map((hour) => (
                        <SelectItem key={hour} value={hour.toString()}>
                          {formatHour(hour)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signOutEndHour">End Hour</Label>
                  <Select
                    value={signOutEndHour.toString()}
                    onValueChange={(value) =>
                      setSignOutEndHour(Number.parseInt(value))
                    }
                  >
                    <SelectTrigger id="signOutEndHour">
                      <SelectValue placeholder="Select hour" />
                    </SelectTrigger>
                    <SelectContent>
                      {hourOptions.map((hour) => (
                        <SelectItem key={hour} value={hour.toString()}>
                          {formatHour(hour)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Current window: {formatHour(signOutStartHour)} -{" "}
                {formatHour(signOutEndHour)}
              </p>
            </div>

            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save Settings"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
