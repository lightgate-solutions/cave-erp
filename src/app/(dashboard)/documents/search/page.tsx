"use client";

import {
  searchAccessibleDocumentsLibrary,
  type AccessibleDocumentSearchRow,
} from "@/actions/documents/documents";
import { SearchResults } from "@/components/documents/search/search-results";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { type FormEvent, useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { useDebouncedCallback } from "use-debounce";

export default function SearchDocumentsPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AccessibleDocumentSearchRow[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchSeq = useRef(0);

  const executeSearch = useCallback(async (raw: string) => {
    const t = (raw ?? "").trim();
    if (!t) {
      searchSeq.current++;
      setResults([]);
      setIsSearching(false);
      return;
    }

    const seq = ++searchSeq.current;
    setIsSearching(true);
    try {
      const res = await searchAccessibleDocumentsLibrary(t);
      if (seq !== searchSeq.current) return;
      if (res.error) {
        toast.error(res.error.reason);
        setResults([]);
      } else {
        setResults(res.success ?? []);
      }
    } catch {
      if (seq !== searchSeq.current) return;
      toast.error("Search failed");
      setResults([]);
    } finally {
      if (seq === searchSeq.current) {
        setIsSearching(false);
      }
    }
  }, []);

  const debouncedSearch = useDebouncedCallback((q: string) => {
    void executeSearch(q);
  }, 300);

  function handleQueryChange(value: string) {
    const next = value ?? "";
    setQuery(next);
    const t = next.trim();
    if (!t) {
      searchSeq.current++;
      debouncedSearch.cancel?.();
      setResults([]);
      setIsSearching(false);
      return;
    }
    debouncedSearch(next);
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    debouncedSearch.flush?.();
    await executeSearch(query);
  }

  const queryTrimmed = query.trim();

  return (
    <div className="space-y-4">
      <div className="border-b bg-muted">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h1 className="text-4xl font-bold text-balance">
                Search Documents
              </h1>
            </div>
          </div>
          <form onSubmit={onSubmit} className="relative max-w-7xl flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                name="search"
                placeholder="Search title, description, folder, tags (updates as you type)…"
                className="pl-12 h-14 text-lg"
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                autoComplete="off"
              />
            </div>
            <Button
              size="lg"
              type="submit"
              className="h-14 hover:cursor-pointer px-8"
              disabled={isSearching || !queryTrimmed}
            >
              {isSearching ? "Searching…" : "Search"}
            </Button>
          </form>
        </div>
      </div>

      <SearchResults
        results={results}
        isSearching={isSearching}
        queryTrimmed={queryTrimmed}
      />
    </div>
  );
}
