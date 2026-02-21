import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CategoryItem } from './constants/categories.constants';
import { RoleType } from '../users/enums/role.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('v1/categories')
@ApiBearerAuth()
@Controller('v1/categories')
@UseGuards(RolesGuard)
@Roles(RoleType.ADMIN, RoleType.MANAGER, RoleType.USER)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'List all categories' })
  @ApiResponse({ status: 200, description: 'List of categories' })
  findAll(): CategoryItem[] {
    return this.categoriesService.findAll();
  }
}
