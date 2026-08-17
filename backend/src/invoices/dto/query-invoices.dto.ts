import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

const SORT_FIELDS = ['invoiceDate', 'dueDate', 'totalAmount'] as const;
const ORDERINGS = ['ASC', 'DESC'] as const;
const STATUSES = ['Draft', 'Pending', 'Paid', 'Overdue'] as const;

export class QueryInvoicesDto {
  @ApiPropertyOptional({
    default: 1,
    description: 'Page number, starting at 1',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: 10, description: 'Records per page' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number = 10;

  @ApiPropertyOptional({ enum: SORT_FIELDS, default: 'invoiceDate' })
  @IsOptional()
  @IsIn(SORT_FIELDS)
  sortBy: (typeof SORT_FIELDS)[number] = 'invoiceDate';

  @ApiPropertyOptional({ enum: ORDERINGS, default: 'DESC' })
  @IsOptional()
  @IsIn(ORDERINGS)
  ordering: (typeof ORDERINGS)[number] = 'DESC';

  @ApiPropertyOptional({ enum: STATUSES })
  @IsOptional()
  @IsIn(STATUSES)
  status?: (typeof STATUSES)[number];

  @ApiPropertyOptional({
    description:
      'Partial, case-insensitive search on invoice number or customer name',
  })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({
    description: 'Filter invoices on/after this date (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({
    description: 'Filter invoices on/before this date (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString()
  toDate?: string;
}
