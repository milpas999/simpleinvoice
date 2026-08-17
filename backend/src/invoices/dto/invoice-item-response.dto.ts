import { ApiProperty } from '@nestjs/swagger';

export class InvoiceItemResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  invoiceId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  rate: number;
}
