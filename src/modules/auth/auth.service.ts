import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { SecureCodeUtil } from 'src/common/utils';
import { JobsService } from '../jobs/jobs.service';
import { JobType } from '../jobs/jobs.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly jobsService: JobsService,
    private readonly config: ConfigService,
  ) {}

  async validateUser(loginDto: LoginDto): Promise<User> {
    const login = loginDto.login.trim();
    let user = await this.usersService.findByEmail(login);
    if (!user) {
      user = await this.usersService.findByUsername(login);
    }
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }
    if (!user.isActive) {
      throw new UnauthorizedException('Usuário inativo');
    }

    // If user doesn't have a password, they can't login normally
    if (!user.password) {
      throw new UnauthorizedException(
        'Usuário precisa definir a senha no primeiro acesso',
      );
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }
    return user;
  }

  async login(
    loginDto: LoginDto,
  ): Promise<{ accessToken: string; user: AuthResponseDto }> {
    const user = await this.validateUser(loginDto);

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    const authResponse: AuthResponseDto = {
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isFirstLogin: user.isFirstLogin,
      requiresPasswordSetup: !user.password,
    };

    return {
      accessToken,
      user: authResponse,
    };
  }

  async refreshToken(userId: string): Promise<{ accessToken: string }> {
    const user = await this.usersService.findOne(userId);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Usuário não encontrado ou inativo');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    return { accessToken };
  }

  /**
   * Validates email + secureCode without consuming the code.
   * Use before showing the "set new password" form. The code is still required
   * when calling set-first-password or reset-password.
   */
  async validateCode(
    email: string,
    secureCode: string,
  ): Promise<{
    valid: boolean;
    userId?: string;
    flow?: 'first-login' | 'recovery';
  }> {
    const user = await this.usersService.findByEmail(email);
    if (!user || !user.isActive) {
      return { valid: false };
    }
    if (!user.secureCode) {
      return { valid: false };
    }
    const isCodeValid = await SecureCodeUtil.verifyCode(
      secureCode,
      user.secureCode,
    );
    if (!isCodeValid) {
      return { valid: false };
    }
    const flow = user.password ? 'recovery' : 'first-login';
    return { valid: true, userId: user.id, flow };
  }

  async checkFirstLogin(
    username: string,
  ): Promise<{ requiresPasswordSetup: boolean }> {
    let user = await this.usersService.findByEmail(username);
    if (!user) {
      user = await this.usersService.findByUsername(username);
    }
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }
    if (!user.isActive) {
      throw new UnauthorizedException('Usuário inativo');
    }

    return {
      requiresPasswordSetup: !user.password,
    };
  }

  async setFirstPassword(
    userId: string,
    password: string,
    secureCode: string,
  ): Promise<{ accessToken: string; user: AuthResponseDto }> {
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }
    if (!user.isActive) {
      throw new UnauthorizedException('Usuário inativo');
    }
    if (user.password) {
      throw new UnauthorizedException(
        'Usuário já possui senha. Use o login normal.',
      );
    }

    // Check if user has a secure code
    if (!user.secureCode) {
      throw new UnauthorizedException(
        'Código de verificação não foi gerado. Solicite um novo convite.',
      );
    }

    // Validate secure code
    const isCodeValid = await SecureCodeUtil.verifyCode(
      secureCode,
      user.secureCode,
    );
    if (!isCodeValid) {
      throw new UnauthorizedException('Código de verificação inválido');
    }

    // Set new password and clear secure code
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.isFirstLogin = false;
    user.secureCode = undefined; // Remove code after use
    await this.usersService.updateUserPassword(user);

    // Generate token and return
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    const authResponse: AuthResponseDto = {
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isFirstLogin: false,
      requiresPasswordSetup: false,
    };

    return {
      accessToken,
      user: authResponse,
    };
  }

  /**
   * Request password reset. Generates secure_code, saves on user, sends email with code.
   * Always returns success to avoid leaking whether the email is registered.
   */
  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(email);

    if (user && user.isActive) {
      const resetCode = SecureCodeUtil.generateCode(6);
      user.secureCode = await SecureCodeUtil.hashCode(resetCode);
      await this.usersService.updateUserPassword(user);

      const frontendUrl = this.config.get<string>(
        'FRONTEND_URL',
        'http://localhost:3001',
      );
      const recoveryPasswordUrl = `${frontendUrl}/recovery-password?userId=${encodeURIComponent(user.id)}&secureCode=${encodeURIComponent(resetCode)}`;

      await this.jobsService.enqueue(JobType.EMAIL_SEND, {
        recipient: {
          kind: 'USER',
          id: user.id,
          email: user.email,
          name: user.name,
        },
        template: { key: 'RESET_PASSWORD' },
        data: {
          name: user.name,
          resetCode,
          recoveryPasswordUrl,
        },
      });
    }

    return {
      message:
        'Se o e-mail estiver cadastrado, você receberá um código para redefinir sua senha.',
    };
  }

  /**
   * Reset password using secure_code received by email.
   * userId and secureCode come from query params (?userId=...&secureCode=...)
   */
  async resetPassword(
    userId: string,
    secureCode: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.usersService.findOne(userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Usuário não encontrado ou inativo');
    }
    if (!user.secureCode) {
      throw new UnauthorizedException(
        'Código de recuperação inválido ou já utilizado.',
      );
    }

    const isCodeValid = await SecureCodeUtil.verifyCode(
      secureCode,
      user.secureCode,
    );
    if (!isCodeValid) {
      throw new UnauthorizedException('Código de recuperação inválido');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.secureCode = undefined;
    await this.usersService.updateUserPassword(user);
  }
}
