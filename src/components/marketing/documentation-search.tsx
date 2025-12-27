"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Search, Settings, BookOpen } from "lucide-react";
import { Card } from "@/components/ui/card";

interface SearchableItem {
  title: string;
  desc: string;
  type: "module" | "tutorial";
  href?: string;
  id?: string;
}

interface DocumentationSearchProps {
  modules: Array<{ title: string; desc: string }>;
  tutorials: Array<{
    id?: string;
    title: string;
    steps: string;
    image?: string;
    images?: Array<{ src: string; alt: string }>;
  }>;
  quickStartItems: Array<{ title: string; description: string; href: string }>;
}

export function DocumentationSearch({
  modules,
  tutorials,
  quickStartItems,
}: DocumentationSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Combine all searchable items
  const allItems: SearchableItem[] = useMemo(() => {
    const items: SearchableItem[] = [];

    // Add Quick Start items
    quickStartItems.forEach((item) => {
      items.push({
        title: item.title,
        desc: item.description,
        type: "tutorial",
        href: item.href,
      });
    });

    // Add modules
    modules.forEach((module) => {
      items.push({
        title: module.title,
        desc: module.desc,
        type: "module",
      });
    });

    // Add tutorials
    tutorials.forEach((tutorial) => {
      items.push({
        title: tutorial.title,
        desc: tutorial.steps,
        type: "tutorial",
        id: tutorial.id,
        href: tutorial.id ? `#${tutorial.id}` : undefined,
      });
    });

    return items;
  }, [modules, tutorials, quickStartItems]);

  // Filter items based on search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) {
      return [];
    }

    const query = searchQuery.toLowerCase().trim();
    return allItems.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        item.desc.toLowerCase().includes(query),
    );
  }, [searchQuery, allItems]);

  const handleItemClick = (item: SearchableItem) => {
    if (item.href) {
      if (item.href.startsWith("#")) {
        // Scroll to anchor
        const element = document.querySelector(item.href);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
          setSearchQuery(""); // Clear search after navigation
        }
      }
    }
  };

  return (
    <div className="relative">
      {/* Search Bar */}
      <div className="relative mx-auto max-w-xl">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search documentation..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-12 pl-10 pr-4"
        />
      </div>

      {/* Search Results */}
      {searchQuery.trim() && (
        <div className="absolute top-full left-1/2 z-50 mt-2 w-full max-w-xl -translate-x-1/2">
          <Card className="max-h-96 overflow-y-auto p-4 shadow-lg">
            {filteredItems.length > 0 ? (
              <div className="space-y-2">
                <p className="mb-2 text-sm font-semibold text-muted-foreground">
                  {filteredItems.length} result
                  {filteredItems.length !== 1 ? "s" : ""} found
                </p>
                {filteredItems.map((item, index) => (
                  <button
                    key={`${item.type}-${item.title}-${index}`}
                    type="button"
                    onClick={() => handleItemClick(item)}
                    className="w-full rounded-lg border p-3 text-left transition-colors hover:border-primary hover:bg-muted/50"
                  >
                    <div className="flex items-start gap-2">
                      {item.type === "module" ? (
                        <Settings className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      ) : (
                        <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      )}
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold">{item.title}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">
                  No results found for &quot;{searchQuery}&quot;
                </p>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
