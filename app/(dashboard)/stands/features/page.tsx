"use client";

import { useEffect, useState, useMemo } from "react";
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  Loader2, 
  ChevronUp, 
  ChevronDown 
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { cn } from "@/lib/utils";
import { 
  getStandFeatures, 
  createStandFeature, 
  updateStandFeature, 
  deleteStandFeature 
} from "@/services/stand-feature.service";
import type { StandFeature } from "@/types/database.types";

type SortKey = "name" | "default_price" | "is_active";
type SortDir = "asc" | "desc";

const ITEMS_PER_PAGE = 10;

export default function FeaturesPage() {
  const [features, setFeatures] = useState<StandFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);
  
  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<StandFeature | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    default_price: 0,
    is_active: true,
  });

  const loadFeatures = async () => {
    setLoading(true);
    try {
      const { data, error } = await getStandFeatures();
      if (error) throw error;
      setFeatures(data || []);
    } catch (error: any) {
      toast.error("Failed to load features", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeatures();
  }, []);

  const resetPage = () => setPage(1);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return features.filter((f) => {
      if (statusFilter === "active" && !f.is_active) return false;
      if (statusFilter === "inactive" && f.is_active) return false;
      if (
        q &&
        !f.name.toLowerCase().includes(q) &&
        !(f.description ?? "").toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [features, search, statusFilter]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "default_price":
          cmp = a.default_price - b.default_price;
          break;
        case "is_active":
          cmp = (a.is_active ? 1 : 0) - (b.is_active ? 1 : 0);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const startIdx = (safePage - 1) * ITEMS_PER_PAGE;
  const pageItems = sorted.slice(startIdx, startIdx + ITEMS_PER_PAGE);
  const showingFrom = sorted.length > 0 ? startIdx + 1 : 0;
  const showingTo = Math.min(startIdx + ITEMS_PER_PAGE, sorted.length);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  function SortIcon({ column }: { column: SortKey }) {
    if (sortKey !== column)
      return <ChevronUp className="ml-1 inline size-3.5 text-muted-foreground/40" />;
    return sortDir === "asc" ? (
      <ChevronUp className="ml-1 inline size-3.5" />
    ) : (
      <ChevronDown className="ml-1 inline size-3.5" />
    );
  }

  const handleOpenDialog = (feature?: StandFeature) => {
    if (feature) {
      setEditingFeature(feature);
      setFormData({
        name: feature.name,
        description: feature.description || "",
        default_price: feature.default_price,
        is_active: feature.is_active,
      });
    } else {
      setEditingFeature(null);
      setFormData({
        name: "",
        description: "",
        default_price: 0,
        is_active: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingFeature) {
        const { error } = await updateStandFeature(editingFeature.id, formData);
        if (error) throw error;
        toast.success("Feature updated successfully");
      } else {
        const { error } = await createStandFeature(formData);
        if (error) throw error;
        toast.success("Feature created successfully");
      }
      setIsDialogOpen(false);
      loadFeatures();
    } catch (error: any) {
      toast.error(editingFeature ? "Failed to update" : "Failed to create", { description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const { error } = await deleteStandFeature(deleteId);
      if (error) throw error;
      toast.success("Feature deleted");
      loadFeatures();
    } catch (error: any) {
      toast.error("Failed to delete", { description: error.message });
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Stand Features" 
        description="Manage additional features and addons available for stands"
      >
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="size-4" /> Add Feature
        </Button>
      </PageHeader>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Search features..." 
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); resetPage(); }}
          />
        </div>
        <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val ?? "all"); resetPage(); }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-2xl border bg-card shadow-ios overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6 cursor-pointer select-none" onClick={() => handleSort("name")}>
                Name <SortIcon column="name" />
              </TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => handleSort("default_price")}>
                Default Price <SortIcon column="default_price" />
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => handleSort("is_active")}>
                Status <SortIcon column="is_active" />
              </TableHead>
              <TableHead className="w-[70px] pr-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <Loader2 className="size-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : pageItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No features found.
                </TableCell>
              </TableRow>
            ) : (
              pageItems.map((feature) => (
                <TableRow key={feature.id} className="group hover:bg-muted/30">
                  <TableCell className="pl-6 font-semibold py-4">
                    {feature.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-subheadline py-4">
                    {feature.description || "-"}
                  </TableCell>
                  <TableCell className="font-medium py-4">
                    ${feature.default_price.toLocaleString()}
                  </TableCell>
                  <TableCell className="py-4">
                    {feature.is_active ? (
                      <Badge className="bg-ios-green/15 text-ios-green border-0 rounded-lg px-2 py-0.5">Active</Badge>
                    ) : (
                      <Badge className="bg-muted text-muted-foreground border-0 rounded-lg px-2 py-0.5">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell className="pr-6 py-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button variant="ghost" size="icon" className="size-8">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenDialog(feature)} className="gap-2 cursor-pointer font-medium p-2.5">
                          <Pencil className="size-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDeleteId(feature.id)} className="gap-2 text-destructive focus:text-destructive cursor-pointer font-medium p-2.5">
                          <Trash2 className="size-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {sorted.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {showingFrom}-{showingTo} of {sorted.length}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={safePage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={safePage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
              Next
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Feature"
        description="Are you sure you want to delete this feature? Standard packages using this feature may be affected."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md rounded-[24px] shadow-2xl p-0 overflow-hidden border-0">
          <form onSubmit={handleSubmit}>
            <DialogHeader className="p-6 pb-0">
              <DialogTitle className="text-title-3 font-bold">
                {editingFeature ? "Edit Feature" : "New Feature"}
              </DialogTitle>
              <DialogDescription className="text-subheadline text-muted-foreground mt-1">
                Configure addon features that can be attached to stands.
              </DialogDescription>
            </DialogHeader>
            
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-footnote font-medium text-muted-foreground px-1">FEATURE NAME</Label>
                <Input
                  id="name"
                  placeholder="e.g. Premium Tent, TV Screen"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="h-12 bg-secondary/50 border-0 rounded-2xl focus-visible:ring-primary/20"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description" className="text-footnote font-medium text-muted-foreground px-1">DESCRIPTION</Label>
                <Textarea
                  id="description"
                  placeholder="Tell us more about this addon..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-secondary/50 border-0 rounded-2xl focus-visible:ring-primary/20 min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-footnote font-medium text-muted-foreground px-1">DEFAULT PRICE (USD)</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.default_price}
                    onChange={(e) => setFormData({ ...formData, default_price: parseFloat(e.target.value) || 0 })}
                    required
                    className="h-12 bg-secondary/50 border-0 rounded-2xl focus-visible:ring-primary/20"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-footnote font-medium text-muted-foreground px-1">AVAILABILITY</Label>
                  <div className="flex h-12 items-center justify-between px-4 bg-secondary/50 rounded-2xl">
                    <span className="text-subheadline font-medium">Active</span>
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="p-6 pt-0 flex gap-3 sm:gap-0 h-16 bg-muted/30">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setIsDialogOpen(false)}
                className="flex-1 rounded-2xl font-semibold text-[15px] h-11 sm:h-auto"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="flex-1 rounded-2xl font-bold text-[15px] shadow-ios ios-press h-11 sm:h-auto"
              >
                {isSubmitting ? <><Loader2 className="size-4 animate-spin mr-2" /> Saving...</> : editingFeature ? "Save Changes" : "Create Feature"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
