import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Athlete } from './entities/athlete.entity';
import { CreateAthleteDto } from './dto/create-athlete.dto';
import { UpdateAthleteDto } from './dto/update-athlete.dto';
import { FilterAthletesDto } from './dto/filter-athletes.dto';
import { AthletesRepository } from './repositories';
import {
  AthleteFilter,
  PaginationOptions,
  PaginatedResult,
} from './repositories/types';
import { CategoriesService } from '../categories/categories.service';

@Injectable()
export class AthletesService {
  constructor(
    private readonly athletesRepository: AthletesRepository,
    private readonly categoriesService: CategoriesService,
  ) {}

  /**
   * Computes age at end of reference year (Dec 31).
   */
  getAgeAtEndOfYear(birthDate: Date, referenceYear?: number): number {
    const year = referenceYear ?? new Date().getFullYear();
    const endOfYear = new Date(year, 11, 31);
    if (birthDate > endOfYear) return -1;
    const birthdayThisYear = new Date(
      year,
      birthDate.getMonth(),
      birthDate.getDate(),
    );
    let age = year - birthDate.getFullYear();
    if (birthdayThisYear > endOfYear) age--;
    return age;
  }

  /**
   * Returns category name from the categories table based on birth date and reference year.
   */
  async calculateCategory(
    birthDate: Date,
    referenceYear?: number,
  ): Promise<string> {
    const age = this.getAgeAtEndOfYear(birthDate, referenceYear);
    return this.categoriesService.getCategoryNameByAge(age);
  }

  private normalizeCpf(cpf: string | undefined): string | null {
    if (!cpf) return null;
    const digits = cpf.replace(/\D/g, '');
    return digits.length === 11 ? digits : null;
  }

  async create(createAthleteDto: CreateAthleteDto): Promise<Athlete> {
    const cpfNormalized = this.normalizeCpf(createAthleteDto.cpf);
    if (cpfNormalized) {
      const existing = await this.athletesRepository.findByCpf(cpfNormalized);
      if (existing) {
        throw new ConflictException('CPF já cadastrado');
      }
    }

    const birthDate = new Date(createAthleteDto.birthDate);
    const age = this.getAgeAtEndOfYear(birthDate);
    const isUnder18 = age >= 0 && age < 18;

    // Validate guardian fields if athlete is under 18
    if (isUnder18) {
      if (!createAthleteDto.guardianName || !createAthleteDto.guardianPhone) {
        throw new ConflictException(
          'Nome e telefone do responsável são obrigatórios para atletas menores de 18 anos',
        );
      }
    }

    const athlete = this.athletesRepository.create({
      fullName: createAthleteDto.fullName,
      birthDate,
      phone: createAthleteDto.phone,
      guardianName: createAthleteDto.guardianName ?? null,
      guardianPhone: createAthleteDto.guardianPhone ?? null,
      isActive: createAthleteDto.isActive ?? true,
      registrationDate: new Date(),
      email: createAthleteDto.email,
      cpf: cpfNormalized,
      heightCm: createAthleteDto.heightCm ?? null,
      weightKg: createAthleteDto.weightKg ?? null,
      dominantHand: createAthleteDto.dominantHand ?? null,
      notes: createAthleteDto.notes ?? null,
    });

    return this.athletesRepository.save(athlete);
  }

  async findAll(filters?: FilterAthletesDto): Promise<PaginatedResult<Athlete>> {
    const repoFilters: AthleteFilter = {};
    if (filters?.name?.trim()) repoFilters.name = filters.name.trim();
    if (filters?.notes?.trim()) repoFilters.notes = filters.notes.trim();
    if (filters?.isActive !== undefined)
      repoFilters.isActive = filters.isActive;
    if (filters?.minHeight != null) repoFilters.minHeight = filters.minHeight;
    if (filters?.maxHeight != null) repoFilters.maxHeight = filters.maxHeight;

    const pagination: PaginationOptions = {
      page: filters?.page ?? 1,
      limit: filters?.limit ?? 10,
    };

    return this.athletesRepository.findAll(repoFilters, pagination);
  }

  async findOne(id: string): Promise<Athlete> {
    const athlete = await this.athletesRepository.findById(id);
    if (!athlete) {
      throw new NotFoundException('Atleta não encontrado');
    }
    return athlete;
  }

  async update(
    id: string,
    updateAthleteDto: UpdateAthleteDto,
  ): Promise<Athlete> {
    const athlete = await this.findOne(id);

    const cpfNormalized = this.normalizeCpf(updateAthleteDto.cpf);
    if (cpfNormalized && cpfNormalized !== athlete.cpf) {
      const existing = await this.athletesRepository.findByCpf(cpfNormalized);
      if (existing) {
        throw new ConflictException('CPF já cadastrado');
      }
    }

    if (updateAthleteDto.fullName != null)
      athlete.fullName = updateAthleteDto.fullName;
    if (updateAthleteDto.birthDate != null)
      athlete.birthDate = new Date(updateAthleteDto.birthDate);
    if (updateAthleteDto.phone != null) athlete.phone = updateAthleteDto.phone;
    if (updateAthleteDto.guardianName != null)
      athlete.guardianName = updateAthleteDto.guardianName;
    if (updateAthleteDto.guardianPhone != null)
      athlete.guardianPhone = updateAthleteDto.guardianPhone;
    if (updateAthleteDto.isActive !== undefined)
      athlete.isActive = updateAthleteDto.isActive;
    if (updateAthleteDto.email !== undefined) {
      if (!updateAthleteDto.email) {
        throw new ConflictException('E-mail é obrigatório e não pode ser vazio');
      }
      athlete.email = updateAthleteDto.email;
    }
    if (updateAthleteDto.cpf !== undefined) athlete.cpf = cpfNormalized;
    if (updateAthleteDto.heightCm !== undefined)
      athlete.heightCm = updateAthleteDto.heightCm ?? null;
    if (updateAthleteDto.weightKg !== undefined)
      athlete.weightKg = updateAthleteDto.weightKg ?? null;
    if (updateAthleteDto.dominantHand !== undefined)
      athlete.dominantHand = updateAthleteDto.dominantHand ?? null;
    if (updateAthleteDto.notes !== undefined)
      athlete.notes = updateAthleteDto.notes ?? null;

    return this.athletesRepository.save(athlete);
  }

  async deactivate(id: string): Promise<Athlete> {
    const athlete = await this.findOne(id);
    athlete.isActive = false;
    return this.athletesRepository.save(athlete);
  }

  /**
   * Returns count of active athletes per category (for dashboard).
   * Uses reference year for age calculation; defaults to current year.
   */
  async getAthletesCountByCategory(
    referenceYear?: number,
  ): Promise<{ category: string; count: number }[]> {
    const categories = this.categoriesService.findAll();
    const athletes = await this.athletesRepository.findBirthDatesForActiveAthletes();
    const year = referenceYear ?? new Date().getFullYear();
    const counts: Record<string, number> = {};
    for (const cat of categories) {
      counts[cat.name] = 0;
    }
    counts['Invalid'] = 0;
    for (const { birthDate } of athletes) {
      const age = this.getAgeAtEndOfYear(
        birthDate instanceof Date ? birthDate : new Date(birthDate),
        year,
      );
      const name =
        this.categoriesService.getCategoryNameByAgeFromList(age, categories);
      counts[name] = (counts[name] ?? 0) + 1;
    }
    return categories
      .map((cat) => ({ category: cat.name, count: counts[cat.name] ?? 0 }))
      .concat(
        counts['Invalid'] > 0
          ? [{ category: 'Invalid', count: counts['Invalid'] }]
          : [],
      );
  }
}
