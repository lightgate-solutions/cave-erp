"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function NavLinks() {
  const [activeHash, setActiveHash] = useState<string>("");
  const pathname = usePathname();

  useEffect(() => {
    // Set initial hash
    if (typeof window !== "undefined") {
      setActiveHash(window.location.hash);

      // Listen for hash changes
      const handleHashChange = () => {
        setActiveHash(window.location.hash);
      };

      window.addEventListener("hashchange", handleHashChange);

      // Also check on scroll for smooth scrolling
      const handleScroll = () => {
        const sections = document.querySelectorAll("section[id]");
        const scrollPosition = window.scrollY + 100;

        sections.forEach((section) => {
          const sectionTop = (section as HTMLElement).offsetTop;
          const sectionHeight = section.clientHeight;
          const sectionId = section.getAttribute("id");

          if (
            scrollPosition >= sectionTop &&
            scrollPosition < sectionTop + sectionHeight
          ) {
            setActiveHash(`#${sectionId}`);
          }
        });
      };

      window.addEventListener("scroll", handleScroll);

      return () => {
        window.removeEventListener("hashchange", handleHashChange);
        window.removeEventListener("scroll", handleScroll);
      };
    }
  }, []);

  const getLinkClassName = (href: string, isRoute = false) => {
    let isActive = false;

    if (isRoute) {
      // For route links, check if pathname matches
      isActive = pathname === href;
    } else {
      // For hash links, check if hash matches
      isActive = activeHash === href;
    }

    return `text-sm font-medium transition-all duration-300 px-3 py-1.5 rounded-md relative bg-transparent hover:shadow-md ${
      isActive
        ? "text-primary font-semibold"
        : "text-foreground hover:text-primary"
    }`;
  };

  return (
    <nav className="hidden items-center space-x-6 md:flex">
      <Link href="#features" className={getLinkClassName("#features")}>
        Features
      </Link>
      <Link href="#pricing" className={getLinkClassName("#pricing")}>
        Pricing
      </Link>
      <Link
        href="/documentation"
        className={getLinkClassName("/documentation", true)}
      >
        Documentation
      </Link>
      <Link href="/help" className={getLinkClassName("/help", true)}>
        Help
      </Link>
    </nav>
  );
}
