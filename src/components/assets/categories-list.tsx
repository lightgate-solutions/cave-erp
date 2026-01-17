"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, MoreHorizontal, Pencil, Trash2, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { CategoryFormDialog } from "./category-form-dialog";

interface Category {
  id: number;
  name: string;
  description: string | null;
  codePrefix: string;
  defaultUsefulLifeYears: number | null;
  defaultResidualValuePercent: string | null;
  isActive: boolean;
  createdAt: string;
  assetCount: number;
}

export default function CategoriesList() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["asset-categories"],
    queryFn: async () => {
      const response = await fetch("/api/assets/categories");
      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }
      return response.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/assets/categories/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete category");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asset-categories"] });
      toast.success("Category deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this category?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingCategory(null);
  };

  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Loading categories...</p>
      </div>
    );
  }

  const categories: Category[] = data?.categories || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/assets/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Asset Categories</h1>
            <p className="text-muted-foreground">
              Manage categories for organizing your assets
            </p>
          </div>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
          <CardDescription>
            Categories help organize assets and define default depreciation
            settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No categories found. Create your first category to start
              organizing assets.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code Prefix</TableHead>
                  <TableHead>Useful Life (Years)</TableHead>
                  <TableHead>Residual Value %</TableHead>
                  <TableHead>Assets</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[70px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{category.name}</p>
                        {category.description && (
                          <p className="text-sm text-muted-foreground">
                            {category.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="bg-muted px-2 py-1 rounded text-sm">
                        {category.codePrefix}
                      </code>
                    </TableCell>
                    <TableCell>
                      {category.defaultUsefulLifeYears || "-"}
                    </TableCell>
                    <TableCell>
                      {category.defaultResidualValuePercent
                        ? `${category.defaultResidualValuePercent}%`
                        : "-"}
                    </TableCell>
                    <TableCell>{category.assetCount}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                          category.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {category.isActive ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleEdit(category)}
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(category.id)}
                            className="text-red-600"
                            disabled={category.assetCount > 0}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CategoryFormDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        category={editingCategory}
      />
    </div>
  );
}
