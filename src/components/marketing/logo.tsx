"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function Logo() {
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Determine if dark mode should be used
  const isDark =
    mounted &&
    (theme === "dark" || (theme === "system" && systemTheme === "dark"));

  // Use light logo as default (before hydration)
  const logoSrc = isDark
    ? "/landing/images/logo-dark.png"
    : "/landing/images/logo-light.png";

  return (
    <Link href="/" className="flex items-center space-x-3">
      <div className="relative h-12 w-auto md:h-14 lg:h-16">
        {/* SVG wrapper for better scaling - embeds the PNG image */}
        <svg
          width="200"
          height="64"
          viewBox="0 0 200 64"
          className="h-full w-auto"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="CAVE ERP"
        >
          <title>CAVE ERP</title>
          <image
            href={logoSrc}
            width="200"
            height="64"
            preserveAspectRatio="xMidYMid meet"
          />
        </svg>
      </div>
    </Link>
  );
}
