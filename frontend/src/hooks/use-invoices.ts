import { useContext } from "react";
import { InvoiceContext, type InvoiceContextValue } from "@/context/invoice-context";

export function useInvoices(): InvoiceContextValue {
  const ctx = useContext(InvoiceContext);
  if (!ctx) {
    throw new Error("useInvoices must be used within an InvoiceProvider");
  }
  return ctx;
}
