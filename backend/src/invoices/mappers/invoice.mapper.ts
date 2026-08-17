import { Invoice } from '../entities/invoice.entity';
import { InvoiceResponseDto } from '../dto/invoice-response.dto';
import { deriveStatus } from '../utils/derive-status.util';

export function toInvoiceResponseDto(invoice: Invoice): InvoiceResponseDto {
  return {
    invoiceId: invoice.invoiceId,
    invoiceNumber: invoice.invoiceNumber,
    invoiceReference: invoice.invoiceReference,
    invoiceDate: invoice.invoiceDate,
    dueDate: invoice.dueDate,
    currency: invoice.currency,
    currencySymbol: invoice.currencySymbol,
    description: invoice.description,
    status: deriveStatus(invoice.status, invoice.dueDate),
    taxPercent: invoice.taxPercent,
    customer: {
      fullname: invoice.customerFullname,
      email: invoice.customerEmail,
      mobileNumber: invoice.customerMobileNumber,
      address: invoice.customerAddress,
    },
    items: (invoice.items ?? []).map((item) => ({
      id: item.id,
      invoiceId: item.invoiceId,
      name: item.name,
      quantity: item.quantity,
      rate: item.rate,
    })),
    invoiceSubTotal: invoice.invoiceSubTotal,
    totalTax: invoice.totalTax,
    totalDiscount: invoice.totalDiscount,
    totalAmount: invoice.totalAmount,
    totalPaid: invoice.totalPaid,
    balanceAmount: invoice.balanceAmount,
    createdAt: invoice.createdAt,
    createdBy: invoice.createdBy,
  };
}
