"use client";

import { usePathname } from "next/navigation";

interface AnchorLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export function AnchorLink({ href, children, className }: AnchorLinkProps) {
  const pathname = usePathname();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Only handle hash links that start with "/#"
    if (href.startsWith("/#")) {
      // If we're already on the landing page, allow default browser behavior for smooth scrolling
      if (pathname === "/") {
        return; // Let browser handle hash navigation naturally
      }

      // If we're on a different page, prevent default and do full page navigation
      // This ensures the landing page loads first, then scrolls to the hash
      e.preventDefault();
      e.stopPropagation();
      window.location.href = href;
    }
  };

  // Use native anchor tag (not Next.js Link) for hash links
  // This ensures proper browser navigation behavior
  if (href.startsWith("/#")) {
    return (
      <a
        href={href}
        onClick={handleClick}
        className={className}
        aria-label={typeof children === "string" ? children : undefined}
      >
        {children}
      </a>
    );
  }

  // Fallback for non-hash links (shouldn't happen in current usage)
  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}
