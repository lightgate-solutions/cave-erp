import { Mountain } from "lucide-react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export function Logo({ size = "md", showText = true }: LogoProps) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-3xl",
  };

  return (
    <div className="flex items-center gap-2">
      <div
        className={`${sizeClasses[size]} rounded-lg bg-primary flex items-center justify-center`}
      >
        <Mountain
          className={`${size === "lg" ? "h-7 w-7" : size === "md" ? "h-5 w-5" : "h-4 w-4"} text-primary-foreground`}
        />
      </div>
      {showText && (
        <span
          className={`${textSizeClasses[size]} font-bold text-foreground tracking-tight`}
        >
          CAVE
        </span>
      )}
    </div>
  );
}
