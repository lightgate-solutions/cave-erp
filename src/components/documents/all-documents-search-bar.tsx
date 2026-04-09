"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import { DocumentSearch } from "./document-search";

export function AllDocumentsSearchBar({
  initialQuery = "",
}: {
  initialQuery?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [searchTerm, setSearchTerm] = useState(() => initialQuery ?? "");

  useEffect(() => {
    setSearchTerm(initialQuery ?? "");
  }, [initialQuery]);

  const syncSearchToUrl = useDebouncedCallback((raw: string) => {
    const params = new URLSearchParams(
      typeof window !== "undefined" ? window.location.search : "",
    );
    const t = (raw ?? "").trim();
    if (t) params.set("q", t);
    else params.delete("q");
    params.delete("page");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, 300);

  function handleSearchChange(value: string) {
    const next = value ?? "";
    setSearchTerm(next);
    syncSearchToUrl(next);
  }

  return (
    <DocumentSearch
      value={searchTerm ?? ""}
      onChange={handleSearchChange}
      placeholder="Search documents (title, description, folder, tags)..."
    />
  );
}
