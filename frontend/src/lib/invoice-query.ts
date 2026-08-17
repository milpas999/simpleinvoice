import { getDisplayStatus } from "@/lib/calculations";
import type { Invoice, InvoiceListParams, InvoiceListResult } from "@/types/invoice";

/**
 * Simulates the GET /invoices contract (search, filter, sort, pagination)
 * against the in-memory invoice list, matching the shape the real API would return.
 */
export function queryInvoices(invoices: Invoice[], params: InvoiceListParams): InvoiceListResult {
  const { page, pageSize, sortBy, ordering, status, keyword, fromDate, toDate } = params;

  let result = invoices.map((invoice) => ({
    ...invoice,
    displayStatus: getDisplayStatus(invoice),
  }));

  if (status && status !== "All") {
    result = result.filter((invoice) => invoice.displayStatus === status);
  }

  if (keyword && keyword.trim().length > 0) {
    const needle = keyword.trim().toLowerCase();
    result = result.filter(
      (invoice) =>
        invoice.invoiceNumber.toLowerCase().includes(needle) ||
        invoice.customer.fullname.toLowerCase().includes(needle)
    );
  }

  if (fromDate) {
    result = result.filter((invoice) => invoice.invoiceDate >= fromDate);
  }

  if (toDate) {
    result = result.filter((invoice) => invoice.invoiceDate <= toDate);
  }

  result = result.sort((a, b) => {
    const direction = ordering === "ASC" ? 1 : -1;
    if (sortBy === "totalAmount") {
      return (a.totalAmount - b.totalAmount) * direction;
    }
    return a[sortBy].localeCompare(b[sortBy]) * direction;
  });

  const total = result.length;
  const start = (page - 1) * pageSize;
  const data = result.slice(start, start + pageSize);

  return {
    data,
    paging: { page, pageSize, total },
  };
}
