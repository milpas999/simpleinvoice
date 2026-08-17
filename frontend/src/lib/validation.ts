const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_REGEX.test(value.trim());
}

export function isNonEmpty(value: string): boolean {
  return value.trim().length > 0;
}

export function isValidDateString(value: string): boolean {
  if (!value) return false;
  const date = new Date(`${value}T00:00:00`);
  return !Number.isNaN(date.getTime());
}

export function isOnOrAfter(dueDate: string, invoiceDate: string): boolean {
  if (!isValidDateString(dueDate) || !isValidDateString(invoiceDate)) return false;
  return new Date(`${dueDate}T00:00:00`) >= new Date(`${invoiceDate}T00:00:00`);
}
