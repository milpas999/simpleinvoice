import { ApiProperty } from '@nestjs/swagger';
import { InvoiceResponseDto } from './invoice-response.dto';
import { PagingDto } from './paging.dto';

export class PagedInvoicesResponseDto {
  @ApiProperty({ type: [InvoiceResponseDto] })
  data: InvoiceResponseDto[];

  @ApiProperty({ type: PagingDto })
  paging: PagingDto;
}
