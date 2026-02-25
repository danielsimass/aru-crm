import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { AthletesService } from './athletes.service';
import { CreateAthleteDto } from './dto/create-athlete.dto';
import { UpdateAthleteDto } from './dto/update-athlete.dto';
import { FilterAthletesDto } from './dto/filter-athletes.dto';
import { Athlete } from './entities/athlete.entity';
import { athletePhotoMulterOptions } from './config/athlete-photo-multer.config';
import { RoleType } from '../users/enums/role.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PaginatedResult } from './repositories/types';

type AthleteWithCategory = Athlete & { category: string };
type PaginatedAthletesWithCategory = PaginatedResult<AthleteWithCategory>;

@ApiTags('v1/athletes')
@ApiBearerAuth()
@Controller('v1/athletes')
@UseGuards(RolesGuard)
export class AthletesController {
  constructor(private readonly athletesService: AthletesService) {}

  @Post()
  @Roles(RoleType.ADMIN)
  @UseInterceptors(FileInterceptor('photo', athletePhotoMulterOptions))
  @ApiOperation({ summary: 'Create a new athlete' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        photo: { type: 'string', format: 'binary' },
        fullName: { type: 'string' },
        birthDate: { type: 'string', format: 'date' },
        phone: { type: 'string' },
        guardianName: { type: 'string' },
        guardianPhone: { type: 'string' },
        isActive: { type: 'boolean' },
        email: { type: 'string' },
        cpf: { type: 'string' },
        heightCm: { type: 'number' },
        weightKg: { type: 'number' },
        dominantHand: { type: 'string', enum: ['left', 'right'] },
        notes: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Athlete created successfully' })
  @ApiResponse({ status: 409, description: 'CPF already registered' })
  @ApiResponse({ status: 403, description: 'Access denied - admin only' })
  async create(
    @Body() createAthleteDto: CreateAthleteDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<AthleteWithCategory> {
    const photoPath = file ? `/uploads/athletes/${file.filename}` : undefined;
    const athlete = await this.athletesService.create(
      createAthleteDto,
      photoPath,
    );
    return this.toResponse(athlete);
  }

  private async toResponse(athlete: Athlete): Promise<AthleteWithCategory> {
    const category = await this.athletesService.calculateCategory(
      new Date(athlete.birthDate),
    );
    return { ...athlete, category };
  }

  @Get()
  @Roles(RoleType.ADMIN, RoleType.MANAGER, RoleType.USER)
  @ApiOperation({ summary: 'List athletes with filters and pagination' })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of athletes',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              fullName: { type: 'string' },
              category: { type: 'string', example: 'Sub-14' },
            },
          },
        },
        total: { type: 'number', example: 100 },
        page: { type: 'number', example: 1 },
        limit: { type: 'number', example: 10 },
        totalPages: { type: 'number', example: 10 },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async findAll(
    @Query() filters: FilterAthletesDto,
  ): Promise<PaginatedAthletesWithCategory> {
    const result = await this.athletesService.findAll(filters);
    const data = await Promise.all(result.data.map((a) => this.toResponse(a)));
    return { ...result, data };
  }

  @Get(':id')
  @Roles(RoleType.ADMIN, RoleType.MANAGER, RoleType.USER)
  @ApiOperation({ summary: 'Get athlete by ID' })
  @ApiResponse({ status: 200, description: 'Athlete found' })
  @ApiResponse({ status: 404, description: 'Athlete not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AthleteWithCategory> {
    const athlete = await this.athletesService.findOne(id);
    return this.toResponse(athlete);
  }

  @Patch(':id')
  @Roles(RoleType.ADMIN)
  @UseInterceptors(FileInterceptor('photo', athletePhotoMulterOptions))
  @ApiOperation({ summary: 'Update an athlete' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        photo: { type: 'string', format: 'binary' },
        fullName: { type: 'string' },
        birthDate: { type: 'string', format: 'date' },
        phone: { type: 'string' },
        guardianName: { type: 'string' },
        guardianPhone: { type: 'string' },
        isActive: { type: 'boolean' },
        email: { type: 'string' },
        cpf: { type: 'string' },
        heightCm: { type: 'number' },
        weightKg: { type: 'number' },
        dominantHand: { type: 'string', enum: ['left', 'right'] },
        notes: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Athlete updated' })
  @ApiResponse({ status: 404, description: 'Athlete not found' })
  @ApiResponse({ status: 409, description: 'CPF already registered' })
  @ApiResponse({ status: 403, description: 'Access denied - admin only' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAthleteDto: UpdateAthleteDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<AthleteWithCategory> {
    const photoPath = file ? `/uploads/athletes/${file.filename}` : undefined;
    const athlete = await this.athletesService.update(
      id,
      updateAthleteDto,
      photoPath,
    );
    return this.toResponse(athlete);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(RoleType.ADMIN)
  @ApiOperation({ summary: 'Deactivate an athlete (soft delete)' })
  @ApiResponse({ status: 204, description: 'Athlete deactivated' })
  @ApiResponse({ status: 404, description: 'Athlete not found' })
  @ApiResponse({ status: 403, description: 'Access denied - admin only' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.athletesService.deactivate(id);
  }
}
