import {
  Injectable,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { FilterUsersDto } from './dto/filter-users.dto';
import { UsersRepository } from './repositories';
import { PaginatedResult, UserFilter, PaginationOptions } from './repositories/types';
import { JobsService } from '../jobs/jobs.service';
import { JobType } from '../jobs/jobs.types';
import { SecureCodeUtil } from '../../common/utils';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly jobsService: JobsService,
    private readonly config: ConfigService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUserByEmail = await this.usersRepository.findByEmail(
      createUserDto.email,
    );

    if (existingUserByEmail) {
      throw new ConflictException('E-mail já cadastrado');
    }

    const existingUserByUsername = await this.usersRepository.findByUsername(
      createUserDto.username,
    );

    if (existingUserByUsername) {
      throw new ConflictException('Nome de usuário já cadastrado');
    }

    const hashedPassword = createUserDto.password
      ? await bcrypt.hash(createUserDto.password, 10)
      : undefined;

    let secureCodePlain: string | undefined;
    if (!createUserDto.password) {
      secureCodePlain = SecureCodeUtil.generateCode(6);
    }

    const user = this.usersRepository.create({
      name: createUserDto.name,
      email: createUserDto.email,
      username: createUserDto.username,
      password: hashedPassword,
      role: createUserDto.role,
    });

    if (secureCodePlain) {
      user.secureCode = await SecureCodeUtil.hashCode(secureCodePlain);
    }

    const savedUser = await this.usersRepository.save(user);

    if (secureCodePlain) {
      const frontendUrl = this.config.get<string>(
        'FRONTEND_URL',
        'http://localhost:3001',
      );
      const firstLoginUrl = `${frontendUrl}/first-login?userId=${encodeURIComponent(savedUser.id)}&secureCode=${encodeURIComponent(secureCodePlain)}`;

      await this.jobsService.enqueue(JobType.EMAIL_SEND, {
        recipient: {
          kind: 'USER',
          id: savedUser.id,
          email: savedUser.email,
          name: savedUser.name,
        },
        template: { key: 'WELCOME' },
        data: {
          name: savedUser.name,
          username: savedUser.username,
          secureCode: secureCodePlain,
          firstLoginUrl,
        },
        meta: { correlationId: `user-welcome-${savedUser.id}` },
      });
    }

    return savedUser;
  }

  async findAll(filters?: FilterUsersDto): Promise<PaginatedResult<User>> {
    const repoFilters: UserFilter = {};
    if (filters?.isActive !== undefined) repoFilters.isActive = filters.isActive;
    if (filters?.role) repoFilters.role = filters.role;
    if (filters?.search) repoFilters.search = filters.search;

    const pagination: PaginationOptions = {
      page: filters?.page ?? 1,
      limit: filters?.limit ?? 10,
    };

    return this.usersRepository.findAll(repoFilters, pagination);
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findById(id);

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findByEmail(email);
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findByUsername(username);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.usersRepository.findByEmail(
        updateUserDto.email,
      );

      if (existingUser) {
        throw new ConflictException('E-mail já cadastrado');
      }
    }

    if (updateUserDto.username && updateUserDto.username !== user.username) {
      const existingUser = await this.usersRepository.findByUsername(
        updateUserDto.username,
      );

      if (existingUser) {
        throw new ConflictException('Nome de usuário já cadastrado');
      }
    }

    Object.assign(user, updateUserDto);
    return this.usersRepository.save(user);
  }

  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    const user = await this.findOne(userId);

    if (user.password) {
      const isPasswordValid = await bcrypt.compare(
        changePasswordDto.currentPassword,
        user.password,
      );

      if (!isPasswordValid) {
        throw new UnauthorizedException('Senha atual incorreta');
      }
    }

    const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);

    user.password = hashedPassword;
    user.isFirstLogin = false;
    await this.usersRepository.save(user);
  }

  async updateUserPassword(user: User): Promise<User> {
    return this.usersRepository.save(user);
  }

  async deactivate(id: string): Promise<User> {
    const user = await this.findOne(id);
    user.isActive = false;
    return this.usersRepository.save(user);
  }

  async activate(id: string): Promise<User> {
    const user = await this.findOne(id);
    user.isActive = true;
    return this.usersRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepository.remove(user);
  }
}
