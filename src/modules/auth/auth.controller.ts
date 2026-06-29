import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Request,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { JwtRefreshAuthGuard } from 'src/common/guards/jwt-refresh-auth.guard';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiOperation({
    summary: 'User Registration',
    description: 'Register a new user account',
  })
  @ApiResponse({
    status: 200,
    description: 'User registered successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request data',
  })
  @ApiResponse({
    status: 409,
    description: 'User already exists',
  })
  async register(
    @Body() registerDto: RegisterDto,
  ): Promise<{ message: string }> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User Login',
    description: 'Login with email and password',
  })
  @ApiResponse({
    status: 200,
    description: 'User logged in successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request data',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
  })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtRefreshAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Refresh Access Token',
    description: 'Refresh the access token using refresh token',
  })
  @ApiResponse({
    status: 200,
    description: 'Access token refreshed successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Access token expired',
  })
  async refresh(
    @Request()
    req: {
      user: { id: string };
      headers: { authorization?: string };
    },
  ) {
    const refreshToken =
      req.headers.authorization?.replace('Bearer ', '') ?? '';
    return this.authService.refreshTokens(req.user.id, refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Logout User',
    description: 'Logout the current user',
  })
  @ApiResponse({
    status: 200,
    description: 'User logged out successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async logout(@Request() req: { user: { id: string } }) {
    return this.authService.logout(req.user.id);
  }
}
