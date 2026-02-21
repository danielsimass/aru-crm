import { Athlete } from '../entities/athlete.entity';
import {
  AthleteCreateData,
  AthleteUpdateData,
  AthleteFilter,
  PaginationOptions,
  PaginatedResult,
} from './types';

export interface IAthletesRepository {
  create(data: AthleteCreateData): Athlete;
  save(athlete: Athlete): Promise<Athlete>;
  findById(id: string): Promise<Athlete | null>;
  findAll(
    filters?: AthleteFilter,
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<Athlete>>;
  findBirthDatesForActiveAthletes(): Promise<{ birthDate: Date }[]>;
  findByCpf(cpf: string): Promise<Athlete | null>;
}
