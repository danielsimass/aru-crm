import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { User } from '../entities/user.entity';
import { IUsersRepository } from './users.repository.interface';
import { UserCreateData, UserFilter, PaginationOptions, PaginatedResult } from './types';

@Injectable()
export class UsersRepository implements IUsersRepository {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
  ) {}

  create(data: UserCreateData): User {
    return this.repository.create(data);
  }

  async save(user: User): Promise<User> {
    return await this.repository.save(user);
  }

  async findById(id: string): Promise<User | null> {
    return this.repository.findOne({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repository.findOne({
      where: { email },
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.repository.findOne({
      where: { username },
    });
  }

  async findAll(
    filters?: UserFilter,
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<User>> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 10;
    const skip = (page - 1) * limit;

    const qb = this.repository
      .createQueryBuilder('user')
      .orderBy('user.created_at', 'DESC');

    if (filters?.isActive !== undefined) {
      qb.andWhere('user.is_active = :isActive', { isActive: filters.isActive });
    }

    if (filters?.role) {
      qb.andWhere('user.role = :role', { role: filters.role });
    }

    if (filters?.search) {
      const searchTerm = `%${filters.search.toLowerCase()}%`;
      qb.andWhere(
        new Brackets((qb) => {
          qb.where('LOWER(user.name) LIKE :search', { search: searchTerm })
            .orWhere('LOWER(user.email) LIKE :search', { search: searchTerm })
            .orWhere('LOWER(user.username) LIKE :search', { search: searchTerm });
        }),
      );
    }

    const [data, total] = await qb.skip(skip).take(limit).getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async remove(user: User): Promise<void> {
    await this.repository.remove(user);
  }
}
