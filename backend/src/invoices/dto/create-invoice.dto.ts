import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Min,
  ValidateNested,
} from 'class-validator';
import { IsOnOrAfter } from '../../common/validators/is-on-or-after.validator';
import { CustomerDto } from './customer.dto';
import { InvoiceItemInputDto } from './invoice-item-input.dto';

export class CreateInvoiceDto {
  @ApiProperty({ example: 'IV1780488206995' })
  @IsString()
  @IsNotEmpty()
  invoiceNumber: string;

  @ApiPropertyOptional({ example: '#5721662' })
  @IsOptional()
  @IsString()
  invoiceReference?: string;

  @ApiProperty({ example: '2026-06-03' })
  @IsDateString()
  invoiceDate: string;

  @ApiProperty({ example: '2026-07-03' })
  @IsDateString()
  @IsOnOrAfter('invoiceDate', {
    message: 'dueDate must be on or after invoiceDate',
  })
  dueDate: string;

  @ApiProperty({ example: 'AUD' })
  @IsString()
  @Length(3, 3)
  currency: string;

  @ApiProperty({ example: 'AU$' })
  @IsString()
  @IsNotEmpty()
  currencySymbol: string;

  @ApiPropertyOptional({ example: 'Invoice is issued to Kanglee' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ type: CustomerDto })
  @ValidateNested()
  @Type(() => CustomerDto)
  customer: CustomerDto;

  @ApiProperty({ type: InvoiceItemInputDto })
  @ValidateNested()
  @Type(() => InvoiceItemInputDto)
  item: InvoiceItemInputDto;

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
