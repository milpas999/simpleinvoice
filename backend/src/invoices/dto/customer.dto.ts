import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CustomerDto {
  @ApiProperty({ example: 'Paul' })
  @IsString()
  @IsNotEmpty()
  fullname: string;

  @ApiProperty({ example: 'paul@101digital.io' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: '947717364111' })
  @IsOptional()
  @IsString()
  mobileNumber?: string;

  @ApiPropertyOptional({ example: 'Singapore' })
  @IsOptional()
  @IsString()
  address?: string;
}
