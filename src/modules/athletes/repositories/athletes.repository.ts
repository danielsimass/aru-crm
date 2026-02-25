import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Athlete } from '../entities/athlete.entity';
import { IAthletesRepository } from './athletes.repository.interface';
import {
  AthleteCreateData,
  AthleteFilter,
  PaginationOptions,
  PaginatedResult,
} from './types';

@Injectable()
export class AthletesRepository implements IAthletesRepository {
  constructor(
    @InjectRepository(Athlete)
    private readonly repository: Repository<Athlete>,
  ) {}

  create(data: AthleteCreateData): Athlete {
    return this.repository.create(data);
  }

  async save(athlete: Athlete): Promise<Athlete> {
    return this.repository.save(athlete);
  }

  async findById(id: string): Promise<Athlete | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findAll(
    filters?: AthleteFilter,
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<Athlete>> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 10;
    const skip = (page - 1) * limit;

    const qb = this.repository
      .createQueryBuilder('athlete')
      .orderBy('athlete.registrationDate', 'DESC');

    if (filters?.name?.trim()) {
      qb.andWhere('LOWER(athlete.full_name) LIKE :name', {
        name: `%${filters.name.trim().toLowerCase()}%`,
      });
    }
    if (filters?.notes?.trim()) {
      qb.andWhere('LOWER(athlete.notes) LIKE :notes', {
        notes: `%${filters.notes.trim().toLowerCase()}%`,
      });
    }
    if (filters?.isActive !== undefined) {
      qb.andWhere('athlete.is_active = :isActive', {
        isActive: filters.isActive,
      });
    }
    if (filters?.minHeight != null) {
      qb.andWhere('athlete.height_cm >= :minHeight', {
        minHeight: filters.minHeight,
      });
    }
    if (filters?.maxHeight != null) {
      qb.andWhere('athlete.height_cm <= :maxHeight', {
        maxHeight: filters.maxHeight,
      });
    }
    if (filters?.minBirthDate != null) {
      qb.andWhere('athlete.birth_date >= :minBirthDate', {
        minBirthDate: filters.minBirthDate,
      });
    }
    if (filters?.maxBirthDate != null) {
      qb.andWhere('athlete.birth_date <= :maxBirthDate', {
        maxBirthDate: filters.maxBirthDate,
      });
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

  async findBirthDatesForActiveAthletes(): Promise<{ birthDate: Date }[]> {
    return this.repository.find({
      where: { isActive: true },
      select: ['birthDate'],
    });
  }

  async findByCpf(cpf: string): Promise<Athlete | null> {
    return this.repository.findOne({ where: { cpf } });
  }
}
