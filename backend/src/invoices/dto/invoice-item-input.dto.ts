import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class InvoiceItemInputDto {
  @ApiProperty({ example: 'Honda RC150' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 1000 })
  @IsNumber()
  @Min(0.01)
  rate: number;
}
