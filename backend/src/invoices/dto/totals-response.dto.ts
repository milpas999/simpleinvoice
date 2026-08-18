import { ApiProperty } from '@nestjs/swagger';

export class TotalsResponseDto {
  @ApiProperty({ example: 2000, description: 'quantity x rate' })
  subTotal: number;

  @ApiProperty({ example: 200, description: 'subTotal x (taxPercent / 100)' })
  taxAmount: number;

  @ApiProperty({
    example: 2180,
    description: 'subTotal + taxAmount - discount',
  })
  totalAmount: number;

  @ApiProperty({
    example: 2180,
    description: 'totalAmount - totalPaid (always 0 for a new, unpaid invoice)',
  })
  balanceAmount: number;
}
