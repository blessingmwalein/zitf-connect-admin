"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Search,
  Loader2,
  CreditCard,
  ShoppingCart,
  Ticket,
  DollarSign,
  ChevronUp,
  ChevronDown,
  Eye,
  ChevronLeft,
  ChevronRight,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/shared/stat-card";
import {
  getOrders,
  getPayments,
  getBillingStats,
  getOrderById,
} from "@/services/billing.service";
import {
  ORDER_STATUS_CONFIG,
  PAYMENT_STATUS_CONFIG,
  PAYMENT_METHOD_LABELS,
  type OrderStatus,
  type PaymentStatus,
} from "@/lib/constants";

export default function BillingPage() {
  const [activeTab, setActiveTab] = useState("orders");
  const [stats, setStats] = useState({
    totalOrders: 0,
    paidPayments: 0,
    issuedTickets: 0,
    totalRevenue: 0,
  });

  // Orders state
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersSearch, setOrdersSearch] = useState("");
  const [ordersStatusFilter, setOrdersStatusFilter] = useState("all");
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersTotal, setOrdersTotal] = useState(0);

  // Payments state
  const [payments, setPayments] = useState<any[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [paymentsStatusFilter, setPaymentsStatusFilter] = useState("all");
  const [paymentsPage, setPaymentsPage] = useState(1);
  const [paymentsTotal, setPaymentsTotal] = useState(0);

  // Order detail dialog
  const [detailOrder, setDetailOrder] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const pageSize = 15;

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    loadOrders();
  }, [ordersPage, ordersStatusFilter]);

  useEffect(() => {
    loadPayments();
  }, [paymentsPage, paymentsStatusFilter]);

  async function loadStats() {
    try {
      const data = await getBillingStats();
      setStats(data);
    } catch {
      // silent
    }
  }

  async function loadOrders() {
    setOrdersLoading(true);
    try {
      const { data, count, error } = await getOrders({
        status: ordersStatusFilter !== "all" ? ordersStatusFilter : undefined,
        search: ordersSearch || undefined,
        page: ordersPage,
        pageSize,
      });
      if (error) throw error;
      setOrders(data || []);
      setOrdersTotal(count || 0);
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setOrdersLoading(false);
    }
  }

  async function loadPayments() {
    setPaymentsLoading(true);
    try {
      const { data, count, error } = await getPayments({
        status: paymentsStatusFilter !== "all" ? paymentsStatusFilter : undefined,
        page: paymentsPage,
        pageSize,
      });
      if (error) throw error;
      setPayments(data || []);
      setPaymentsTotal(count || 0);
    } catch {
      toast.error("Failed to load payments");
    } finally {
      setPaymentsLoading(false);
    }
  }

  async function openOrderDetail(orderId: string) {
    setDetailLoading(true);
    try {
      const { data, error } = await getOrderById(orderId);
      if (error) throw error;
      setDetailOrder(data);
    } catch {
      toast.error("Failed to load order details");
    } finally {
      setDetailLoading(false);
    }
  }

  function handleOrdersSearch() {
    setOrdersPage(1);
    loadOrders();
  }

  const ordersTotalPages = Math.ceil(ordersTotal / pageSize);
  const paymentsTotalPages = Math.ceil(paymentsTotal / pageSize);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing & Payments"
        description="View orders, payment logs, and revenue"
      />

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Orders"
          value={stats.totalOrders}
          icon={ShoppingCart}
        />
        <StatCard
          title="Paid Payments"
          value={stats.paidPayments}
          icon={CreditCard}
        />
        <StatCard
          title="Tickets Issued"
          value={stats.issuedTickets}
          icon={Ticket}
        />
        <StatCard
          title="Total Revenue"
          value={`$${stats.totalRevenue.toFixed(2)}`}
          icon={DollarSign}
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="payments">Payment Logs</TabsTrigger>
        </TabsList>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 items-center gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by email..."
                  value={ordersSearch}
                  onChange={(e) => setOrdersSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleOrdersSearch()}
                  className="pl-9"
                />
              </div>
              <Select value={ordersStatusFilter} onValueChange={(v) => { setOrdersStatusFilter(v ?? "all"); setOrdersPage(1); }}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordersLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      <ShoppingCart className="mx-auto h-8 w-8 mb-2 opacity-50" />
                      No orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => {
                    const statusConfig = ORDER_STATUS_CONFIG[order.status as OrderStatus];
                    const paymentInfo = order.payments?.[0];
                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-sm">{order.order_number}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{order.user_email}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">{order.user_type}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ${Number(order.total_amount).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusConfig?.color || ""}>
                            {statusConfig?.label || order.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {paymentInfo ? (
                            <span className="text-xs">
                              {PAYMENT_METHOD_LABELS[paymentInfo.payment_method] || paymentInfo.payment_method}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openOrderDetail(order.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
            {!ordersLoading && (
              <div className="border-t px-4 py-3 flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  Showing {(ordersPage - 1) * pageSize + 1}-{Math.min(ordersPage * pageSize, ordersTotal)} of {ordersTotal}
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={ordersPage <= 1}
                    onClick={() => setOrdersPage((p) => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={ordersPage >= ordersTotalPages}
                    onClick={() => setOrdersPage((p) => p + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-4">
          <div className="flex items-center gap-2">
            <Select value={paymentsStatusFilter} onValueChange={(v) => { setPaymentsStatusFilter(v ?? "all"); setPaymentsPage(1); }}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Paid At</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentsLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      <CreditCard className="mx-auto h-8 w-8 mb-2 opacity-50" />
                      No payment records found
                    </TableCell>
                  </TableRow>
                ) : (
                  payments.map((payment) => {
                    const statusConfig = PAYMENT_STATUS_CONFIG[payment.status as PaymentStatus];
                    return (
                      <TableRow key={payment.id}>
                        <TableCell className="font-mono text-sm">
                          {payment.orders?.order_number || "-"}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {payment.orders?.user_email || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {PAYMENT_METHOD_LABELS[payment.payment_method] || payment.payment_method}
                          </Badge>
                        </TableCell>
                        <TableCell className="capitalize text-xs">{payment.payment_type}</TableCell>
                        <TableCell className="text-right font-medium">
                          ${Number(payment.amount).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusConfig?.color || ""}>
                            {statusConfig?.label || payment.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {payment.paid_at
                            ? new Date(payment.paid_at).toLocaleString()
                            : "-"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(payment.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
            {!paymentsLoading && (
              <div className="border-t px-4 py-3 flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  Showing {(paymentsPage - 1) * pageSize + 1}-{Math.min(paymentsPage * pageSize, paymentsTotal)} of {paymentsTotal}
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={paymentsPage <= 1}
                    onClick={() => setPaymentsPage((p) => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={paymentsPage >= paymentsTotalPages}
                    onClick={() => setPaymentsPage((p) => p + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Order Detail Dialog */}
      <Dialog open={!!detailOrder} onOpenChange={(open) => !open && setDetailOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>

          {detailLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : detailOrder ? (
            <div className="space-y-4">
              {/* Order Info */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Order Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Order #:</span>{" "}
                    <span className="font-mono">{detailOrder.order_number}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>{" "}
                    <Badge className={ORDER_STATUS_CONFIG[detailOrder.status as OrderStatus]?.color || ""}>
                      {ORDER_STATUS_CONFIG[detailOrder.status as OrderStatus]?.label || detailOrder.status}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email:</span> {detailOrder.user_email}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Type:</span>{" "}
                    <span className="capitalize">{detailOrder.user_type}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total:</span>{" "}
                    <span className="font-bold">${Number(detailOrder.total_amount).toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Date:</span>{" "}
                    {new Date(detailOrder.created_at).toLocaleString()}
                  </div>
                </CardContent>
              </Card>

              {/* Order Items */}
              {detailOrder.order_items?.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ticket</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead className="text-right">Unit Price</TableHead>
                          <TableHead className="text-right">Subtotal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detailOrder.order_items.map((item: any) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.ticket_types?.name || "Unknown"}</TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                            <TableCell className="text-right">${Number(item.unit_price).toFixed(2)}</TableCell>
                            <TableCell className="text-right font-medium">${Number(item.subtotal).toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {/* Payment History */}
              {detailOrder.payments?.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Payment History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {detailOrder.payments.map((p: any) => (
                        <div key={p.id} className="flex items-center justify-between border-b pb-2 last:border-0 text-sm">
                          <div>
                            <Badge variant="outline">
                              {PAYMENT_METHOD_LABELS[p.payment_method] || p.payment_method}
                            </Badge>
                            {p.phone_number && (
                              <span className="ml-2 text-muted-foreground">{p.phone_number}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-medium">${Number(p.amount).toFixed(2)}</span>
                            <Badge className={PAYMENT_STATUS_CONFIG[p.status as PaymentStatus]?.color || ""}>
                              {PAYMENT_STATUS_CONFIG[p.status as PaymentStatus]?.label || p.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Issued Tickets */}
              {detailOrder.tickets?.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Issued Tickets</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {detailOrder.tickets.map((t: any) => (
                        <div key={t.id} className="flex items-center justify-between border-b pb-2 last:border-0 text-sm">
                          <div className="font-mono text-xs">{t.id.substring(0, 12)}...</div>
                          <div className="flex items-center gap-2">
                            <Badge className={t.is_used ? "bg-ios-orange/15 text-ios-orange" : "bg-ios-green/15 text-ios-green"}>
                              {t.is_used ? "Used" : "Valid"}
                            </Badge>
                            <Badge variant="outline">
                              {t.downloaded ? `Downloaded (${t.download_count}x)` : "Not downloaded"}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
