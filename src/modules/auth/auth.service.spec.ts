import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import bcrypt from 'bcrypt';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: jest.Mocked<
    Pick<UsersService, 'create' | 'findByEmail' | 'updateRefreshToken'>
  >;
  let jwtService: jest.Mocked<Pick<JwtService, 'signAsync'>>;
  let configService: jest.Mocked<Pick<ConfigService, 'getOrThrow'>>;

  beforeEach(async () => {
    usersService = {
      create: jest.fn(),
      findByEmail: jest.fn(),
      updateRefreshToken: jest.fn(),
    };

    jwtService = {
      signAsync: jest.fn(),
    };

    configService = {
      getOrThrow: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  describe('register', () => {
    it('should hash password and create a user successfully', async () => {
      (jest.spyOn(bcrypt, 'hash') as jest.Mock).mockResolvedValue(
        'fake-hashed-password',
      );

      const result = await authService.register({
        email: 'test@test.com',
        password: 'password123',
      });

      expect(usersService.create).toHaveBeenCalledWith(
        'test@test.com',
        'fake-hashed-password',
      );
      expect(result).toEqual({ message: 'User registered successfully' });
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException if user not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        authService.login({ email: 'wrong@test.com', password: 'password' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return tokens on successful login', async () => {
      usersService.findByEmail.mockResolvedValue({
        id: '123',
        email: 'test@test.com',
        password: 'hashed-password',
        hashedRefreshToken: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        urls: [],
      });

      (jest.spyOn(bcrypt, 'compare') as jest.Mock).mockResolvedValue(true);

      configService.getOrThrow.mockReturnValue('secret');
      jwtService.signAsync
        .mockResolvedValueOnce('fake-access-token')
        .mockResolvedValueOnce('fake-refresh-token');

      const result = await authService.login({
        email: 'test@test.com',
        password: 'password',
      });

      expect(result).toEqual({
        accessToken: 'fake-access-token',
        refreshToken: 'fake-refresh-token',
      });
      expect(usersService.updateRefreshToken).toHaveBeenCalled();
    });
  });
});
