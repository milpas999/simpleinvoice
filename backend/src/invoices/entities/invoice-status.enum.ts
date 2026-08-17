/** Persisted statuses only. "Overdue" is never stored — it is derived at read time. */
export enum InvoiceStatus {
  Draft = 'Draft',
  Pending = 'Pending',
  Paid = 'Paid',
}

/** Status values the API can return, including the read-time derived "Overdue". */
export type DisplayStatus = InvoiceStatus | 'Overdue';
