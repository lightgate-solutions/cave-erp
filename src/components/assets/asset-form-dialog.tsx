"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface Asset {
  id: number;
  name: string;
  description: string | null;
  categoryId?: number;
  locationId?: number | null;
  purchaseDate?: string | null;
  purchasePrice?: string | null;
  vendor?: string | null;
  poNumber?: string | null;
  currentValue?: string | null;
  usefulLifeYears?: number | null;
  residualValue?: string | null;
  depreciationStartDate?: string | null;
  warrantyStartDate?: string | null;
  warrantyEndDate?: string | null;
  warrantyProvider?: string | null;
  warrantyTerms?: string | null;
  serialNumber?: string | null;
  model?: string | null;
  manufacturer?: string | null;
  barcode?: string | null;
  requiresMaintenance?: boolean;
  notes?: string | null;
  status?: string;
  category?: {
    id: number;
    name: string;
  } | null;
  location?: {
    id: number;
    name: string;
  } | null;
}

interface Category {
  id: number;
  name: string;
  codePrefix: string;
  defaultUsefulLifeYears?: number | null;
  defaultResidualValuePercent?: string | null;
}

interface Location {
  id: number;
  name: string;
}

interface AssetFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset?: Asset | null;
  categories: Category[];
  locations: Location[];
}

const assetStatuses = [
  "Active",
  "In Maintenance",
  "Retired",
  "Disposed",
  "Lost/Stolen",
];

export function AssetFormDialog({
  open,
  onOpenChange,
  asset,
  categories,
  locations,
}: AssetFormDialogProps) {
  // Basic Info
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [status, setStatus] = useState("Active");

  // Physical Details
  const [serialNumber, setSerialNumber] = useState("");
  const [model, setModel] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [barcode, setBarcode] = useState("");

  // Purchase Info
  const [purchaseDate, setPurchaseDate] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [vendor, setVendor] = useState("");
  const [poNumber, setPoNumber] = useState("");

  // Depreciation
  const [currentValue, setCurrentValue] = useState("");
  const [usefulLifeYears, setUsefulLifeYears] = useState("");
  const [residualValue, setResidualValue] = useState("");
  const [depreciationStartDate, setDepreciationStartDate] = useState("");

  // Warranty
  const [warrantyStartDate, setWarrantyStartDate] = useState("");
  const [warrantyEndDate, setWarrantyEndDate] = useState("");
  const [warrantyProvider, setWarrantyProvider] = useState("");
  const [warrantyTerms, setWarrantyTerms] = useState("");

  // Other
  const [requiresMaintenance, setRequiresMaintenance] = useState(false);
  const [notes, setNotes] = useState("");

  const queryClient = useQueryClient();

  useEffect(() => {
    if (!open) return;

    if (asset) {
      setName(asset.name || "");
      setDescription(asset.description || "");
      setCategoryId(
        asset.category?.id?.toString() || asset.categoryId?.toString() || "",
      );
      setLocationId(
        asset.location?.id?.toString() || asset.locationId?.toString() || "",
      );
      setStatus(asset.status || "Active");
      setSerialNumber(asset.serialNumber || "");
      setModel(asset.model || "");
      setManufacturer(asset.manufacturer || "");
      setBarcode(asset.barcode || "");
      setPurchaseDate(
        asset.purchaseDate
          ? new Date(asset.purchaseDate).toISOString().split("T")[0]
          : "",
      );
      setPurchasePrice(asset.purchasePrice || "");
      setVendor(asset.vendor || "");
      setPoNumber(asset.poNumber || "");
      setCurrentValue(asset.currentValue || "");
      setUsefulLifeYears(asset.usefulLifeYears?.toString() || "");
      setResidualValue(asset.residualValue || "");
      setDepreciationStartDate(
        asset.depreciationStartDate
          ? new Date(asset.depreciationStartDate).toISOString().split("T")[0]
          : "",
      );
      setWarrantyStartDate(
        asset.warrantyStartDate
          ? new Date(asset.warrantyStartDate).toISOString().split("T")[0]
          : "",
      );
      setWarrantyEndDate(
        asset.warrantyEndDate
          ? new Date(asset.warrantyEndDate).toISOString().split("T")[0]
          : "",
      );
      setWarrantyProvider(asset.warrantyProvider || "");
      setWarrantyTerms(asset.warrantyTerms || "");
      setRequiresMaintenance(asset.requiresMaintenance || false);
      setNotes(asset.notes || "");
    } else {
      // Reset form
      setName("");
      setDescription("");
      setCategoryId("");
      setLocationId("");
      setStatus("Active");
      setSerialNumber("");
      setModel("");
      setManufacturer("");
      setBarcode("");
      setPurchaseDate("");
      setPurchasePrice("");
      setVendor("");
      setPoNumber("");
      setCurrentValue("");
      setUsefulLifeYears("");
      setResidualValue("");
      setDepreciationStartDate("");
      setWarrantyStartDate("");
      setWarrantyEndDate("");
      setWarrantyProvider("");
      setWarrantyTerms("");
      setRequiresMaintenance(false);
      setNotes("");
    }
  }, [open, asset]);

  // When category changes, apply default depreciation settings
  const handleCategoryChange = (value: string) => {
    setCategoryId(value);
    if (!asset) {
      const category = categories.find((c) => c.id.toString() === value);
      if (category) {
        if (category.defaultUsefulLifeYears) {
          setUsefulLifeYears(category.defaultUsefulLifeYears.toString());
        }
        if (category.defaultResidualValuePercent && purchasePrice) {
          const price = Number(purchasePrice);
          const residualPercent = Number(category.defaultResidualValuePercent);
          setResidualValue(((price * residualPercent) / 100).toFixed(2));
        }
      }
    }
  };

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const response = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create asset");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["asset-stats"] });
      queryClient.invalidateQueries({ queryKey: ["asset-categories"] });
      toast.success("Asset created successfully");
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const response = await fetch(`/api/assets/${asset?.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update asset");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["asset-stats"] });
      toast.success("Asset updated successfully");
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!categoryId) {
      toast.error("Category is required");
      return;
    }

    const data = {
      name: name.trim(),
      description: description.trim() || null,
      categoryId: Number(categoryId),
      locationId: locationId ? Number(locationId) : null,
      status,
      serialNumber: serialNumber.trim() || null,
      model: model.trim() || null,
      manufacturer: manufacturer.trim() || null,
      barcode: barcode.trim() || null,
      purchaseDate: purchaseDate || null,
      purchasePrice: purchasePrice ? Number(purchasePrice) : null,
      vendor: vendor.trim() || null,
      poNumber: poNumber.trim() || null,
      currentValue: currentValue
        ? Number(currentValue)
        : purchasePrice
          ? Number(purchasePrice)
          : null,
      usefulLifeYears: usefulLifeYears ? Number(usefulLifeYears) : null,
      residualValue: residualValue ? Number(residualValue) : null,
      depreciationStartDate: depreciationStartDate || null,
      warrantyStartDate: warrantyStartDate || null,
      warrantyEndDate: warrantyEndDate || null,
      warrantyProvider: warrantyProvider.trim() || null,
      warrantyTerms: warrantyTerms.trim() || null,
      requiresMaintenance,
      notes: notes.trim() || null,
    };

    if (asset) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{asset ? "Edit Asset" : "Add New Asset"}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="physical">Physical</TabsTrigger>
            <TabsTrigger value="purchase">Purchase</TabsTrigger>
            <TabsTrigger value="depreciation">Depreciation</TabsTrigger>
            <TabsTrigger value="warranty">Warranty</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4 mt-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Asset name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={categoryId} onValueChange={handleCategoryChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        {c.name} ({c.codePrefix})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="location">Location</Label>
                <Select value={locationId} onValueChange={setLocationId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((l) => (
                      <SelectItem key={l.id} value={l.id.toString()}>
                        {l.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {asset && (
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {assetStatuses.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="requiresMaintenance">
                  Requires Maintenance
                </Label>
                <p className="text-xs text-muted-foreground">
                  Enable to set up maintenance schedules
                </p>
              </div>
              <Switch
                id="requiresMaintenance"
                checked={requiresMaintenance}
                onCheckedChange={setRequiresMaintenance}
              />
            </div>
          </TabsContent>

          <TabsContent value="physical" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="serialNumber">Serial Number</Label>
                <Input
                  id="serialNumber"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  placeholder="S/N"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="barcode">Barcode</Label>
                <Input
                  id="barcode"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="Barcode"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="manufacturer">Manufacturer</Label>
                <Input
                  id="manufacturer"
                  value={manufacturer}
                  onChange={(e) => setManufacturer(e.target.value)}
                  placeholder="Manufacturer"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="Model"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="purchase" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="purchaseDate">Purchase Date</Label>
                <Input
                  id="purchaseDate"
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="purchasePrice">Purchase Price (₦)</Label>
                <Input
                  id="purchasePrice"
                  type="number"
                  step="0.01"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="vendor">Vendor</Label>
                <Input
                  id="vendor"
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  placeholder="Vendor name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="poNumber">PO Number</Label>
                <Input
                  id="poNumber"
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                  placeholder="Purchase order number"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="depreciation" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="currentValue">Current Value (₦)</Label>
                <Input
                  id="currentValue"
                  type="number"
                  step="0.01"
                  value={currentValue}
                  onChange={(e) => setCurrentValue(e.target.value)}
                  placeholder="Current book value"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="depreciationStartDate">
                  Depreciation Start
                </Label>
                <Input
                  id="depreciationStartDate"
                  type="date"
                  value={depreciationStartDate}
                  onChange={(e) => setDepreciationStartDate(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="usefulLifeYears">Useful Life (Years)</Label>
                <Input
                  id="usefulLifeYears"
                  type="number"
                  value={usefulLifeYears}
                  onChange={(e) => setUsefulLifeYears(e.target.value)}
                  placeholder="e.g., 5"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="residualValue">Residual Value (₦)</Label>
                <Input
                  id="residualValue"
                  type="number"
                  step="0.01"
                  value={residualValue}
                  onChange={(e) => setResidualValue(e.target.value)}
                  placeholder="Value at end of useful life"
                />
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Depreciation Method: Straight-Line
            </p>
          </TabsContent>

          <TabsContent value="warranty" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="warrantyStartDate">Warranty Start</Label>
                <Input
                  id="warrantyStartDate"
                  type="date"
                  value={warrantyStartDate}
                  onChange={(e) => setWarrantyStartDate(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="warrantyEndDate">Warranty End</Label>
                <Input
                  id="warrantyEndDate"
                  type="date"
                  value={warrantyEndDate}
                  onChange={(e) => setWarrantyEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="warrantyProvider">Warranty Provider</Label>
              <Input
                id="warrantyProvider"
                value={warrantyProvider}
                onChange={(e) => setWarrantyProvider(e.target.value)}
                placeholder="Provider name"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="warrantyTerms">Warranty Terms</Label>
              <Textarea
                id="warrantyTerms"
                value={warrantyTerms}
                onChange={(e) => setWarrantyTerms(e.target.value)}
                placeholder="Warranty terms and conditions"
                rows={3}
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="grid gap-2 mt-4">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Additional notes"
            rows={2}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Saving..." : asset ? "Save Changes" : "Create Asset"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
