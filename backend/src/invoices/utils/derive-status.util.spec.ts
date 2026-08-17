import { InvoiceStatus } from '../entities/invoice-status.enum';
import { deriveStatus } from './derive-status.util';

describe('deriveStatus', () => {
  const today = new Date('2026-08-18T00:00:00');

  it('returns Paid unchanged even when dueDate is in the past', () => {
    expect(deriveStatus(InvoiceStatus.Paid, '2026-01-01', today)).toBe('Paid');
  });

  it('returns Overdue when Pending and dueDate is in the past', () => {
    expect(deriveStatus(InvoiceStatus.Pending, '2026-01-01', today)).toBe(
      'Overdue',
    );
  });

  it('returns Overdue when Draft and dueDate is in the past', () => {
    expect(deriveStatus(InvoiceStatus.Draft, '2026-08-01', today)).toBe(
      'Overdue',
    );
  });

  it('returns the persisted status when dueDate is today', () => {
    expect(deriveStatus(InvoiceStatus.Pending, '2026-08-18', today)).toBe(
      'Pending',
    );
  });

  it('returns the persisted status when dueDate is in the future', () => {
    expect(deriveStatus(InvoiceStatus.Draft, '2026-12-31', today)).toBe(
      'Draft',
    );
  });
});
