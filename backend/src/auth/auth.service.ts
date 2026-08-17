import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersRepository } from '../users/users.repository';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.usersRepository.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const expiresIn = parseInt(
      this.configService.get<string>('JWT_EXPIRES_IN', '3600'),
      10,
    );
    const accessToken = this.jwtService.sign(
      { sub: user.id, email: user.email },
      { expiresIn },
    );

    return {
      accessToken,
      expiresIn,
      user: { id: user.id, email: user.email, fullname: user.fullname },
    };
  }
}
