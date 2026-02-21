import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class FilterAthletesDto {
  @ApiPropertyOptional({
    example: 'João',
    description: 'Search by athlete full name (partial, case-insensitive)',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    example: 'alérgico',
    description: 'Search in notes (partial, case-insensitive)',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Filter by active status',
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 160, description: 'Minimum height in cm' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minHeight?: number;

  @ApiPropertyOptional({ example: 190, description: 'Maximum height in cm' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxHeight?: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'Page number (starts at 1)',
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    example: 10,
    description: 'Items per page',
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  limit?: number;
}
