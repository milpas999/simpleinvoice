import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CustomerDto } from './customer.dto';
import { InvoiceItemResponseDto } from './invoice-item-response.dto';

export class InvoiceResponseDto {
  @ApiProperty()
  invoiceId: string;

  @ApiProperty()
  invoiceNumber: string;

  @ApiPropertyOptional()
  invoiceReference?: string;

  @ApiProperty()
  invoiceDate: string;

  @ApiProperty()
  dueDate: string;

  @ApiProperty()
  currency: string;

  @ApiProperty()
  currencySymbol: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty({
    enum: ['Draft', 'Pending', 'Paid', 'Overdue'],
    description: 'Derived at read time; never persisted as Overdue',
  })
  status: 'Draft' | 'Pending' | 'Paid' | 'Overdue';

  @ApiProperty()
  taxPercent: number;

  @ApiProperty({ type: CustomerDto })
  customer: CustomerDto;

  @ApiProperty({ type: [InvoiceItemResponseDto] })
  items: InvoiceItemResponseDto[];

  @ApiProperty()
  invoiceSubTotal: number;

  @ApiProperty()
  totalTax: number;

  @ApiProperty()
  totalDiscount: number;

  @ApiProperty()
  totalAmount: number;

  @ApiProperty()
  totalPaid: number;

  @ApiProperty()
  balanceAmount: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  createdBy: string;
}
