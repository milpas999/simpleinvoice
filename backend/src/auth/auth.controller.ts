import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  CurrentUser,
  type AuthenticatedUser,
} from './decorators/current-user.decorator';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate user, return JWT' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid email or password' })
  login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Return current authenticated user profile' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiResponse({ status: 401 })
  me(@CurrentUser() user: AuthenticatedUser): UserResponseDto {
    return user;
  }
}
