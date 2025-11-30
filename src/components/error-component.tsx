"use client";

import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorComponentProps {
  title?: string;
  message?: string;
  onRefresh?: () => void;
}

export default function ErrorComponent({
  title = "Something went wrong",
  message = "An unexpected error occurred. Please try again.",
  onRefresh,
}: ErrorComponentProps) {
  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center justify-center gap-6 px-4 text-center max-w-md">
        <div className="rounded-full bg-destructive/10 p-4">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          <p className="text-muted-foreground">{message}</p>
        </div>

        <Button onClick={handleRefresh} className="gap-2" size="lg">
          <RotateCcw className="h-4 w-4" />
          Refresh
        </Button>
      </div>
    </div>
  );
}
