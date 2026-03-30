"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Loader2,
  ChevronUp,
  ChevronDown,
  Ticket,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/layout/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  getTicketTypes,
  createTicketType,
  updateTicketType,
  deleteTicketType,
} from "@/services/ticket-type.service";
import {
  TICKET_CATEGORY_LABELS,
  type TicketCategory,
} from "@/lib/constants";
import type { TicketType } from "@/types/database.types";

type SortField = "name" | "price" | "sold_count" | "ticket_category" | "created_at";
type SortDir = "asc" | "desc";

export default function TicketsPage() {
  const router = useRouter();
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<TicketType | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    currency: "USD",
    max_quantity: "",
    ticket_category: "visitor" as "visitor" | "exhibitor",
    valid_from: "",
    valid_until: "",
    is_active: true,
  });

  async function loadData() {
    setLoading(true);
    try {
      const { data, error } = await getTicketTypes();
      if (error) throw error;
      setTicketTypes((data as unknown as TicketType[]) || []);
    } catch {
      toast.error("Failed to load ticket types");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filtered = useMemo(() => {
    let result = [...ticketTypes];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          (t.description?.toLowerCase().includes(q) ?? false)
      );
    }
    if (categoryFilter !== "all") {
      result = result.filter((t) => t.ticket_category === categoryFilter);
    }
    result.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      const cmp =
        typeof aVal === "string"
          ? aVal.localeCompare(bVal as string)
          : (aVal as number) - (bVal as number);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return result;
  }, [ticketTypes, search, categoryFilter, sortField, sortDir]);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return null;
    return sortDir === "asc" ? (
      <ChevronUp className="ml-1 h-3 w-3 inline" />
    ) : (
      <ChevronDown className="ml-1 h-3 w-3 inline" />
    );
  }

  function openCreate() {
    setEditingTicket(null);
    setFormData({
      name: "",
      description: "",
      price: "",
      currency: "USD",
      max_quantity: "",
      ticket_category: "visitor",
      valid_from: "",
      valid_until: "",
      is_active: true,
    });
    setDialogOpen(true);
  }

  function openEdit(ticket: TicketType) {
    setEditingTicket(ticket);
    setFormData({
      name: ticket.name,
      description: ticket.description || "",
      price: String(ticket.price),
      currency: ticket.currency,
      max_quantity: ticket.max_quantity !== null ? String(ticket.max_quantity) : "",
      ticket_category: ticket.ticket_category,
      valid_from: ticket.valid_from ? ticket.valid_from.substring(0, 16) : "",
      valid_until: ticket.valid_until ? ticket.valid_until.substring(0, 16) : "",
      is_active: ticket.is_active,
    });
    setDialogOpen(true);
  }

  async function handleSubmit() {
    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description || null,
        price: parseFloat(formData.price) || 0,
        currency: formData.currency,
        max_quantity: formData.max_quantity ? parseInt(formData.max_quantity) : null,
        ticket_category: formData.ticket_category,
        valid_from: formData.valid_from || null,
        valid_until: formData.valid_until || null,
        is_active: formData.is_active,
      };

      if (editingTicket) {
        const { error } = await updateTicketType(editingTicket.id, payload);
        if (error) throw error;
        toast.success("Ticket type updated");
      } else {
        const { error } = await createTicketType(payload);
        if (error) throw error;
        toast.success("Ticket type created");
      }

      setDialogOpen(false);
      loadData();
    } catch (e: any) {
      toast.error(e?.message || "Failed to save ticket type");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      const { error } = await deleteTicketType(deleteId);
      if (error) throw error;
      toast.success("Ticket type deleted");
      loadData();
    } catch {
      toast.error("Failed to delete ticket type");
    } finally {
      setDeleteId(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ticket Types"
        description="Manage ticket types and pricing for visitors and exhibitors"
      />

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search tickets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v ?? "all")}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="visitor">Visitor</SelectItem>
              <SelectItem value="exhibitor">Exhibitor</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Ticket Type
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer" onClick={() => toggleSort("name")}>
                Name <SortIcon field="name" />
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => toggleSort("ticket_category")}>
                Category <SortIcon field="ticket_category" />
              </TableHead>
              <TableHead className="cursor-pointer text-right" onClick={() => toggleSort("price")}>
                Price <SortIcon field="price" />
              </TableHead>
              <TableHead className="cursor-pointer text-right" onClick={() => toggleSort("sold_count")}>
                Sold <SortIcon field="sold_count" />
              </TableHead>
              <TableHead>Max Qty</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  <Ticket className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  No ticket types found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{ticket.name}</p>
                      {ticket.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {ticket.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {TICKET_CATEGORY_LABELS[ticket.ticket_category as TicketCategory]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ${ticket.price.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    {ticket.sold_count}
                    {ticket.max_quantity !== null && (
                      <span className="text-muted-foreground">/{ticket.max_quantity}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {ticket.max_quantity !== null ? ticket.max_quantity.toLocaleString() : "Unlimited"}
                  </TableCell>
                  <TableCell>
                    <Badge className={ticket.is_active ? "bg-ios-green/15 text-ios-green" : "bg-muted text-muted-foreground"}>
                      {ticket.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(ticket)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteId(ticket.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {!loading && (
          <div className="border-t px-4 py-3 text-sm text-muted-foreground">
            Showing {filtered.length} of {ticketTypes.length} ticket types
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingTicket ? "Edit Ticket Type" : "Create Ticket Type"}</DialogTitle>
            <DialogDescription>
              {editingTicket ? "Update the ticket type details below." : "Define a new ticket type for purchase."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., General Admission - Visitor"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what this ticket includes"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="price">Price (USD) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.ticket_category}
                  onValueChange={(v) => setFormData({ ...formData, ticket_category: v as "visitor" | "exhibitor" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="visitor">Visitor</SelectItem>
                    <SelectItem value="exhibitor">Exhibitor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="max_quantity">Max Quantity (leave empty for unlimited)</Label>
              <Input
                id="max_quantity"
                type="number"
                min="0"
                value={formData.max_quantity}
                onChange={(e) => setFormData({ ...formData, max_quantity: e.target.value })}
                placeholder="Unlimited"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="valid_from">Valid From</Label>
                <Input
                  id="valid_from"
                  type="datetime-local"
                  value={formData.valid_from}
                  onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="valid_until">Valid Until</Label>
                <Input
                  id="valid_until"
                  type="datetime-local"
                  value={formData.valid_until}
                  onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="is_active">Active (visible for purchase)</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingTicket ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Ticket Type"
        description="Are you sure you want to delete this ticket type? This action cannot be undone."
        onConfirm={handleDelete}
        variant="destructive"
      />
    </div>
  );
}
