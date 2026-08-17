import type { DisplayStatus, Invoice } from "@/types/invoice";

export interface TotalsInput {
  quantity: number;
  rate: number;
  taxPercent: number;
  discount: number;
  totalPaid?: number;
}

export interface Totals {
  subTotal: number;
  taxAmount: number;
  totalAmount: number;
  balanceAmount: number;
}

/**
 * Mirrors the server-side calculation documented in requirements.md 2.3.2.
 * This is UI-only: in the real system the backend is the source of truth.
 */
export function calculateTotals({
  quantity,
  rate,
  taxPercent,
  discount,
  totalPaid = 0,
}: TotalsInput): Totals {
  const subTotal = quantity * rate;
  const taxAmount = subTotal * (taxPercent / 100);
  const totalAmount = subTotal + taxAmount - discount;
  const balanceAmount = totalAmount - totalPaid;

  return { subTotal, taxAmount, totalAmount, balanceAmount };
}

/**
 * Derived at read time, never persisted: requirements.md 2.3.2.
 * if status != "Paid" AND dueDate < today -> "Overdue", otherwise the persisted status.
 */
export function getDisplayStatus(invoice: Pick<Invoice, "status" | "dueDate">, today = new Date()): DisplayStatus {
  const due = new Date(`${invoice.dueDate}T00:00:00`);
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  if (invoice.status !== "Paid" && due < todayStart) {
    return "Overdue";
  }

  return invoice.status;
}

export function formatCurrency(amount: number, currencySymbol: string): string {
  const formatted = Math.abs(amount).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return amount < 0 ? `-${currencySymbol}${formatted}` : `${currencySymbol}${formatted}`;
}

export function formatDate(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
