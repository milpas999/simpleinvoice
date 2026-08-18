export interface CalculateTotalsInput {
  quantity: number;
  rate: number;
  taxPercent: number;
  discount: number;
  totalPaid?: number;
}

export interface CalculatedTotals {
  subTotal: number;
  taxAmount: number;
  totalAmount: number;
  balanceAmount: number;
}

/**
 * Single source of truth for invoice total calculation (requirements.md 2.3.2).
 * Used both when persisting a new invoice and by the calculate-totals preview endpoint.
 */
export function calculateTotals({
  quantity,
  rate,
  taxPercent,
  discount,
  totalPaid = 0,
}: CalculateTotalsInput): CalculatedTotals {
  const subTotal = quantity * rate;
  const taxAmount = subTotal * (taxPercent / 100);
  const totalAmount = subTotal + taxAmount - discount;
  const balanceAmount = totalAmount - totalPaid;

  return { subTotal, taxAmount, totalAmount, balanceAmount };
}
