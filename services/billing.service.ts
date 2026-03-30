"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getOrders(opts?: {
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  const supabase = await createClient();
  const page = opts?.page ?? 1;
  const pageSize = opts?.pageSize ?? 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from("orders")
    .select("*, order_items(quantity, subtotal, ticket_types(name)), payments(status, payment_method, paid_at)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (opts?.status) query = query.eq("status", opts.status);
  if (opts?.search) query = query.ilike("user_email", `%${opts.search}%`);

  return query as Promise<{ data: Record<string, unknown>[] | null; count: number | null; error: unknown }>;
}

export async function getOrderById(id: string) {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as any)
    .from("orders")
    .select("*, order_items(*, ticket_types(name, description, ticket_category)), payments(*), tickets(*)")
    .eq("id", id)
    .single() as Promise<{ data: Record<string, unknown> | null; error: unknown }>;
}

export async function getPayments(opts?: {
  status?: string;
  page?: number;
  pageSize?: number;
}) {
  const supabase = await createClient();
  const page = opts?.page ?? 1;
  const pageSize = opts?.pageSize ?? 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from("payments")
    .select("*, orders(order_number, user_email, user_type)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (opts?.status) query = query.eq("status", opts.status);

  return query as Promise<{ data: Record<string, unknown>[] | null; count: number | null; error: unknown }>;
}

export async function getBillingStats() {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;

  const [ordersResult, paymentsResult, ticketsResult, revenueResult] = await Promise.all([
    sb.from("orders").select("id", { count: "exact", head: true }),
    sb.from("payments").select("id", { count: "exact", head: true }).eq("status", "paid"),
    sb.from("tickets").select("id", { count: "exact", head: true }),
    sb.from("payments").select("amount").eq("status", "paid"),
  ]);

  const totalRevenue = (revenueResult.data || []).reduce(
    (sum: number, p: { amount: number }) => sum + (p.amount || 0),
    0
  );

  return {
    totalOrders: ordersResult.count || 0,
    paidPayments: paymentsResult.count || 0,
    issuedTickets: ticketsResult.count || 0,
    totalRevenue,
  };
}

export async function getRecentPayments(limit = 10) {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as any)
    .from("payments")
    .select("*, orders(order_number, user_email)")
    .order("created_at", { ascending: false })
    .limit(limit) as Promise<{ data: Record<string, unknown>[] | null; error: unknown }>;
}
