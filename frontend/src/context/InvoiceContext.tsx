import { useCallback, useMemo, useState, type ReactNode } from "react";
import { InvoiceContext, type CreateInvoiceInput, type InvoiceContextValue } from "@/context/invoice-context";
import { calculateTotals } from "@/lib/calculations";
import { DuplicateInvoiceNumberError } from "@/lib/invoice-errors";
import { generateMockInvoices } from "@/lib/mock-data";
import type { Invoice } from "@/types/invoice";

export function InvoiceProvider({ children }: { children: ReactNode }) {
  const [invoices, setInvoices] = useState<Invoice[]>(() => generateMockInvoices());

  const isInvoiceNumberTaken = useCallback(
    (invoiceNumber: string) =>
      invoices.some((invoice) => invoice.invoiceNumber.toLowerCase() === invoiceNumber.trim().toLowerCase()),
    [invoices]
  );

  const addInvoice = useCallback(
    (input: CreateInvoiceInput): Invoice => {
      if (isInvoiceNumberTaken(input.invoiceNumber)) {
        throw new DuplicateInvoiceNumberError(input.invoiceNumber);
      }

      const invoiceId = crypto.randomUUID();
      const { subTotal, taxAmount, totalAmount, balanceAmount } = calculateTotals({
        quantity: input.item.quantity,
        rate: input.item.rate,
        taxPercent: input.taxPercent,
        discount: input.discount,
        totalPaid: 0,
      });

      const newInvoice: Invoice = {
        invoiceId,
        invoiceNumber: input.invoiceNumber.trim(),
        invoiceDate: input.invoiceDate,
        dueDate: input.dueDate,
        currency: input.currency,
        currencySymbol: input.currencySymbol,
        status: "Draft",
        taxPercent: input.taxPercent,
        customer: { ...input.customer },
        items: [
          {
            id: crypto.randomUUID(),
            invoiceId,
            name: input.item.name,
            quantity: input.item.quantity,
            rate: input.item.rate,
          },
        ],
        invoiceSubTotal: subTotal,
        totalTax: taxAmount,
        totalDiscount: input.discount,
        totalAmount,
        totalPaid: 0,
        balanceAmount,
        createdAt: new Date().toISOString(),
        createdBy: input.createdBy,
      };

      setInvoices((prev) => [newInvoice, ...prev]);
      return newInvoice;
    },
    [isInvoiceNumberTaken]
  );

  const getInvoiceById = useCallback((id: string) => invoices.find((invoice) => invoice.invoiceId === id), [invoices]);

  const value = useMemo<InvoiceContextValue>(
    () => ({ invoices, getInvoiceById, addInvoice, isInvoiceNumberTaken }),
    [invoices, getInvoiceById, addInvoice, isInvoiceNumberTaken]
  );

  return <InvoiceContext.Provider value={value}>{children}</InvoiceContext.Provider>;
}
