import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, Min } from 'class-validator';

export class CalculateInvoiceTotalsDto {
  @ApiProperty({ example: 2, description: 'Quantity of the line item' })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 1000, description: 'Rate per unit' })
  @IsNumber()
  @Min(0.01)
  rate: number;

  @ApiPropertyOptional({
    example: 10,
    default: 10,
    description: 'Tax percentage, defaults to 10',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  taxPercent: number = 10;

  @ApiPropertyOptional({
    example: 0,
    default: 0,
    description: 'Flat discount amount, defaults to 0',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discount: number = 0;
}
