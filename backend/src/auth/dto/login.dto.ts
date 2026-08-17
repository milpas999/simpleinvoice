import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'reviewer@simpleinvoice.dev' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Reviewer123!' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
