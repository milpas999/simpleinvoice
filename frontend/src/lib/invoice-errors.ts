export class DuplicateInvoiceNumberError extends Error {
  constructor(invoiceNumber: string) {
    super(`Invoice number "${invoiceNumber}" already exists.`);
  }
}
