import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from './user-response.dto';

export class AuthResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty({ description: 'Access token lifetime in seconds' })
  expiresIn: number;

  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;
}
