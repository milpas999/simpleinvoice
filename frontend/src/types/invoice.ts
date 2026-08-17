/** Status values persisted in the database. "Overdue" is never stored — the API derives it at read time. */
export type PersistedStatus = "Draft" | "Pending" | "Paid";

/** Status values the API/UI can show, including the read-time derived "Overdue". */
export type DisplayStatus = PersistedStatus | "Overdue";

export const PERSISTED_STATUSES: PersistedStatus[] = ["Draft", "Pending", "Paid"];
export const FILTERABLE_STATUSES: DisplayStatus[] = ["Draft", "Pending", "Paid", "Overdue"];

export interface Customer {
  fullname: string;
  email: string;
  mobileNumber?: string;
  address?: string;
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  name: string;
  quantity: number;
  rate: number;
}

export interface Invoice {
  invoiceId: string;
  invoiceNumber: string;
  invoiceReference?: string;
  invoiceDate: string;
  dueDate: string;
  currency: string;
  currencySymbol: string;
  description?: string;
  /** Always the derived value from the API — never a raw persisted status. */
  status: DisplayStatus;
  taxPercent: number;
  customer: Customer;
  items: InvoiceItem[];
  invoiceSubTotal: number;
  totalTax: number;
  totalDiscount: number;
  totalAmount: number;
  totalPaid: number;
  balanceAmount: number;
  createdAt: string;
  createdBy: string;
}

export type SortField = "invoiceDate" | "dueDate" | "totalAmount";
export type SortOrder = "ASC" | "DESC";

export interface InvoiceListParams {
  page: number;
  pageSize: number;
  sortBy: SortField;
  ordering: SortOrder;
  status?: DisplayStatus | "All";
  keyword?: string;
  fromDate?: string;
  toDate?: string;
}

export interface Paging {
  page: number;
  pageSize: number;
  total: number;
}

export interface InvoiceListResult {
  data: Invoice[];
  paging: Paging;
}

/** Payload sent to POST /invoices. Status/totals/createdBy are always server-computed. */
export interface CreateInvoicePayload {
  invoiceNumber: string;
  invoiceReference?: string;
  invoiceDate: string;
  dueDate: string;
  currency: string;
  currencySymbol: string;
  description?: string;
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
}
