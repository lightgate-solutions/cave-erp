"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface VendorsFiltersFormProps {
  initialSearch: string;
  initialCategory: string;
  initialStatus: string;
}

export function VendorsFiltersForm({
  initialSearch,
  initialCategory,
  initialStatus,
}: VendorsFiltersFormProps) {
  const router = useRouter();
  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState(initialCategory);
  const [status, setStatus] = useState(initialStatus);

  useEffect(() => {
    setSearch(initialSearch);
    setCategory(initialCategory);
    setStatus(initialStatus);
  }, [initialSearch, initialCategory, initialStatus]);

  function applyFilters(e: React.FormEvent) {
    e.preventDefault();
    const qs = new URLSearchParams();
    if (search.trim()) qs.set("search", search.trim());
    if (category && category !== "all") qs.set("category", category);
    if (status && status !== "all") qs.set("status", status);
    const q = qs.toString();
    const next = q ? `/payables/vendors?${q}` : "/payables/vendors";
    const currentPath = `${window.location.pathname}${window.location.search}`;
    if (next === currentPath) {
      router.refresh();
    } else {
      router.push(next);
    }
  }

  return (
    <form onSubmit={applyFilters} className="flex flex-col gap-4 md:flex-row">
      <div className="flex-1">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search vendors..."
            className="pl-8"
            name="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      <Select value={category} onValueChange={setCategory}>
        <SelectTrigger className="w-full md:w-[200px]">
          <SelectValue placeholder="All Categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          <SelectItem value="Services">Services</SelectItem>
          <SelectItem value="Goods">Goods</SelectItem>
          <SelectItem value="Utilities">Utilities</SelectItem>
          <SelectItem value="Custom">Custom</SelectItem>
        </SelectContent>
      </Select>
      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger className="w-full md:w-[200px]">
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="Active">Active</SelectItem>
          <SelectItem value="Inactive">Inactive</SelectItem>
          <SelectItem value="Suspended">Suspended</SelectItem>
          <SelectItem value="Archived">Archived</SelectItem>
        </SelectContent>
      </Select>
      <Button type="submit">Apply Filters</Button>
    </form>
  );
}
