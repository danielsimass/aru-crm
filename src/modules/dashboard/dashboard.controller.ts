import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DashboardService, DashboardData } from './dashboard.service';
import { RoleType } from '../users/enums/role.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('v1/dashboard')
@ApiBearerAuth()
@Controller('v1/dashboard')
@UseGuards(RolesGuard)
@Roles(RoleType.ADMIN, RoleType.MANAGER, RoleType.USER)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({ summary: 'Get dashboard data for home' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard metrics and athletes by category',
    schema: {
      type: 'object',
      properties: {
        athletesByCategory: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              count: { type: 'number' },
            },
          },
        },
        totalAthletes: { type: 'number' },
        activeAthletes: { type: 'number' },
        totalUsers: { type: 'number' },
        referenceYear: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async getDashboard(
    @Query('referenceYear') referenceYear?: string,
  ): Promise<DashboardData> {
    const year = referenceYear ? parseInt(referenceYear, 10) : undefined;
    return this.dashboardService.getDashboard(year);
  }
}
