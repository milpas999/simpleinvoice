import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CalculateInvoiceTotalsDto } from './dto/calculate-invoice-totals.dto';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { InvoiceResponseDto } from './dto/invoice-response.dto';
import { PagedInvoicesResponseDto } from './dto/paged-invoices-response.dto';
import { QueryInvoicesDto } from './dto/query-invoices.dto';
import { TotalsResponseDto } from './dto/totals-response.dto';
import { InvoiceStatus } from './entities/invoice-status.enum';
import { InvoicesRepository } from './invoices.repository';
import { toInvoiceResponseDto } from './mappers/invoice.mapper';
import { calculateTotals } from './utils/calculate-totals.util';

const POSTGRES_UNIQUE_VIOLATION = '23505';

@Injectable()
export class InvoicesService {
  constructor(private readonly invoicesRepository: InvoicesRepository) {}

  async list(query: QueryInvoicesDto): Promise<PagedInvoicesResponseDto> {
    const [invoices, total] = await this.invoicesRepository.findPaged(query);
    return {
      data: invoices.map(toInvoiceResponseDto),
      paging: { page: query.page, pageSize: query.pageSize, total },
    };
  }

  async getById(invoiceId: string): Promise<InvoiceResponseDto> {
    const invoice = await this.invoicesRepository.findById(invoiceId);
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }
    return toInvoiceResponseDto(invoice);
  }

  calculateTotals(dto: CalculateInvoiceTotalsDto): TotalsResponseDto {
    return calculateTotals({
      quantity: dto.quantity,
      rate: dto.rate,
      taxPercent: dto.taxPercent,
      discount: dto.discount,
    });
  }

  async create(
    dto: CreateInvoiceDto,
    createdBy: string,
  ): Promise<InvoiceResponseDto> {
    const totalPaid = 0;
    const {
      subTotal: invoiceSubTotal,
      taxAmount: totalTax,
      totalAmount,
      balanceAmount,
    } = calculateTotals({
      quantity: dto.item.quantity,
      rate: dto.item.rate,
      taxPercent: dto.taxPercent,
      discount: dto.discount,
      totalPaid,
    });

    try {
      const invoice = await this.invoicesRepository.create({
        invoiceNumber: dto.invoiceNumber,
        invoiceReference: dto.invoiceReference,
        invoiceDate: dto.invoiceDate,
        dueDate: dto.dueDate,
        currency: dto.currency,
        currencySymbol: dto.currencySymbol,
        description: dto.description,
        status: InvoiceStatus.Draft,
        taxPercent: dto.taxPercent,
        customerFullname: dto.customer.fullname,
        customerEmail: dto.customer.email,
        customerMobileNumber: dto.customer.mobileNumber,
        customerAddress: dto.customer.address,
        invoiceSubTotal,
        totalTax,
        totalDiscount: dto.discount,
        totalAmount,
        totalPaid,
        balanceAmount,
        createdBy,
        items: [
          {
            name: dto.item.name,
            quantity: dto.item.quantity,
            rate: dto.item.rate,
          },
        ],
      });
      return toInvoiceResponseDto(invoice);
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code;
      if (code === POSTGRES_UNIQUE_VIOLATION) {
        throw new ConflictException(
          `Invoice number "${dto.invoiceNumber}" already exists`,
        );
      }
      throw error;
    }
  }
}
