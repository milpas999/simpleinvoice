import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersRepository } from '../users/users.repository';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let usersRepository: jest.Mocked<UsersRepository>;

  const storedUser = {
    id: 'user-1',
    email: 'reviewer@simpleinvoice.dev',
    fullname: 'Reviewer',
    passwordHash: '',
    createdAt: new Date(),
  };

  beforeAll(async () => {
    storedUser.passwordHash = await bcrypt.hash('Reviewer123!', 10);
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersRepository,
          useValue: { findByEmail: jest.fn() },
        },
        {
          provide: JwtService,
          useValue: { sign: jest.fn().mockReturnValue('signed-token') },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('3600') },
        },
      ],
    }).compile();

    service = module.get(AuthService);
    usersRepository = module.get(UsersRepository);
  });

  it('returns a token and user profile on successful login', async () => {
    usersRepository.findByEmail.mockResolvedValue(storedUser);

    const result = await service.login({
      email: storedUser.email,
      password: 'Reviewer123!',
    });

    expect(result.accessToken).toBe('signed-token');
    expect(result.user).toEqual({
      id: storedUser.id,
      email: storedUser.email,
      fullname: storedUser.fullname,
    });
  });

  it('throws the same generic error for an unknown email (no user enumeration)', async () => {
    usersRepository.findByEmail.mockResolvedValue(null);
    await expect(
      service.login({ email: 'nobody@example.com', password: 'whatever' }),
    ).rejects.toThrow(new UnauthorizedException('Invalid email or password'));
  });

  it('throws the same generic error for a wrong password (no user enumeration)', async () => {
    usersRepository.findByEmail.mockResolvedValue(storedUser);
    await expect(
      service.login({ email: storedUser.email, password: 'wrong-password' }),
    ).rejects.toThrow(new UnauthorizedException('Invalid email or password'));
  });
});
