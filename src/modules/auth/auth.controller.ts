import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Res,
  Get,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import type { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { SetFirstPasswordDto } from './dto/set-first-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ValidateCodeDto } from './dto/validate-code.dto';
import { Public } from './decorators/public.decorator';

@ApiTags('v1/auth')
@Controller('v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponseDto> {
    const { accessToken, user } = await this.authService.login(loginDto);
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 60 * 60 * 1000,
    };
    response.cookie('access_token', accessToken, cookieOptions);
    return user;
  }

  @Post('logout')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Logout' })
  @ApiResponse({ status: 204, description: 'Logout successful' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  logout(@Res({ passthrough: true }) response: Response): void {
    response.clearCookie('access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get authenticated user information' })
  @ApiResponse({
    status: 200,
    description: 'User information',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  getMe(@Req() request: Request): Record<string, unknown> {
    return request.user as Record<string, unknown>;
  }

  @Post('refresh')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ message: string }> {
    const user = request.user as { userId: string };
    const { accessToken } = await this.authService.refreshToken(user.userId);
    response.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 1000,
    });
    return { message: 'Token atualizado com sucesso' };
  }

  @Public()
  @Post('validate-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Validate email + code before showing set-password form',
  })
  @ApiResponse({
    status: 200,
    description:
      'Validation result (code not consumed; still required on save)',
    schema: {
      type: 'object',
      properties: {
        valid: { type: 'boolean' },
        userId: { type: 'string', format: 'uuid' },
        flow: {
          type: 'string',
          enum: ['first-login', 'recovery'],
          description:
            'first-login = set first password; recovery = reset password',
        },
      },
    },
  })
  async validateCode(@Body() dto: ValidateCodeDto): Promise<{
    valid: boolean;
    userId?: string;
    flow?: 'first-login' | 'recovery';
  }> {
    return this.authService.validateCode(dto.email, dto.secureCode);
  }

  @Public()
  @Post('check-first-login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Check if user needs to set password on first access',
  })
  @ApiResponse({
    status: 200,
    description: 'First login status checked',
    schema: {
      type: 'object',
      properties: {
        requiresPasswordSetup: { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'User not found or inactive' })
  async checkFirstLogin(@Body() body: { username: string }): Promise<{
    requiresPasswordSetup: boolean;
  }> {
    return this.authService.checkFirstLogin(body.username);
  }

  @Public()
  @Post('set-first-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Set password on first access and automatically login',
  })
  @ApiResponse({
    status: 200,
    description: 'Password set and login successful',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'User not found, inactive or already has password',
  })
  async setFirstPassword(
    @Body() setFirstPasswordDto: SetFirstPasswordDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponseDto> {
    const { accessToken, user } = await this.authService.setFirstPassword(
      setFirstPasswordDto.userId,
      setFirstPasswordDto.password,
      setFirstPasswordDto.secureCode,
    );
    response.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 1000,
    });
    return user;
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset by email' })
  @ApiResponse({
    status: 200,
    description: 'If email is registered, a reset link will be sent',
    schema: {
      type: 'object',
      properties: { message: { type: 'string' } },
    },
  })
  async forgotPassword(
    @Body() dto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    return this.authService.requestPasswordReset(dto.email);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Reset password using code received by email' })
  @ApiResponse({ status: 204, description: 'Password reset successfully' })
  @ApiResponse({ status: 401, description: 'Invalid code or email' })
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<void> {
    await this.authService.resetPassword(
      dto.userId,
      dto.secureCode,
      dto.newPassword,
    );
  }
}
