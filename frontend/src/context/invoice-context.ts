import { createContext } from "react";
import type { Invoice } from "@/types/invoice";

export interface CreateInvoiceInput {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  currency: string;
  currencySymbol: string;
  customer: {
    fullname: string;
    email: string;
    mobileNumber?: string;
    address?: string;
  };
  item: {
    name: string;
    quantity: number;
    rate: number;
  };
  taxPercent: number;
  discount: number;
  createdBy: string;
}

export interface InvoiceContextValue {
  invoices: Invoice[];
  getInvoiceById: (id: string) => Invoice | undefined;
  addInvoice: (input: CreateInvoiceInput) => Invoice;
  isInvoiceNumberTaken: (invoiceNumber: string) => boolean;
}

export const InvoiceContext = createContext<InvoiceContextValue | undefined>(undefined);
