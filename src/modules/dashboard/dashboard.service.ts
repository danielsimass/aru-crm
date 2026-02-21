import { Injectable } from '@nestjs/common';
import { AthletesService } from '../athletes/athletes.service';
import { UsersService } from '../users/users.service';

export interface AthletesByCategoryItem {
  category: string;
  count: number;
}

export interface DashboardData {
  athletesByCategory: AthletesByCategoryItem[];
  totalAthletes: number;
  activeAthletes: number;
  totalUsers: number;
  referenceYear: number;
}

@Injectable()
export class DashboardService {
  constructor(
    private readonly athletesService: AthletesService,
    private readonly usersService: UsersService,
  ) {}

  async getDashboard(referenceYear?: number): Promise<DashboardData> {
    const year = referenceYear ?? new Date().getFullYear();

    const [athletesByCategory, athletesPage, activeAthletesPage, usersPage] =
      await Promise.all([
        this.athletesService.getAthletesCountByCategory(year),
        this.athletesService.findAll({ limit: 1 }),
        this.athletesService.findAll({ isActive: true, limit: 1 }),
        this.usersService.findAll({ limit: 1 }),
      ]);

    return {
      athletesByCategory,
      totalAthletes: athletesPage.total,
      activeAthletes: activeAthletesPage.total,
      totalUsers: usersPage.total,
      referenceYear: year,
    };
  }
}
