/** Status values persisted in the database. "Overdue" is never stored — see getDisplayStatus. */
export type PersistedStatus = "Draft" | "Pending" | "Paid";

/** Status values the UI can show, including the read-time derived "Overdue". */
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
  status: PersistedStatus;
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
  data: (Invoice & { displayStatus: DisplayStatus })[];
  paging: Paging;
}
