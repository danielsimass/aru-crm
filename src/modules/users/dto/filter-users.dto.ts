import { IsBoolean, IsEnum, IsOptional, IsString, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { RoleType } from '../enums/role.enum';

export class FilterUsersDto {
  @ApiPropertyOptional({ example: true, description: 'Filter by active status' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ enum: RoleType, description: 'Filter by role' })
  @IsOptional()
  @IsEnum(RoleType)
  role?: RoleType;

  @ApiPropertyOptional({ example: 'john', description: 'Search by name or email' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 1, description: 'Page number (starts at 1)', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 10, description: 'Items per page', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  limit?: number;
}
