import { DisplayStatus, InvoiceStatus } from '../entities/invoice-status.enum';

/**
 * Derived at read time, never persisted (requirements.md §2.3.2):
 * if status != "Paid" AND dueDate < today -> "Overdue", otherwise the persisted status.
 */
export function deriveStatus(
  status: InvoiceStatus,
  dueDate: string,
  today: Date = new Date(),
): DisplayStatus {
  const due = new Date(`${dueDate}T00:00:00`);
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  if (status !== InvoiceStatus.Paid && due < todayStart) {
    return 'Overdue';
  }

  return status;
}
