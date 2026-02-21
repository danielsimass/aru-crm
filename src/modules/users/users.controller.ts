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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { FilterUsersDto } from './dto/filter-users.dto';
import { User } from './entities/user.entity';
import { RoleType } from './enums/role.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PaginatedResult } from './repositories/types';

@ApiTags('v1/users')
@ApiBearerAuth()
@Controller('v1/users')
@Roles(RoleType.ADMIN, RoleType.MANAGER)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    type: User,
  })
  @ApiResponse({
    status: 409,
    description: 'Email or username already registered',
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied - admin or manager only',
  })
  create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: 'List users with filters and pagination' })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of users',
    schema: {
      type: 'object',
      properties: {
        data: { type: 'array', items: { $ref: '#/components/schemas/User' } },
        total: { type: 'number', example: 100 },
        page: { type: 'number', example: 1 },
        limit: { type: 'number', example: 10 },
        totalPages: { type: 'number', example: 10 },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied - admin or manager only',
  })
  findAll(@Query() filters: FilterUsersDto): Promise<PaginatedResult<User>> {
    return this.usersService.findAll(filters);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current authenticated user' })
  @ApiResponse({ status: 200, description: 'Current user', type: User })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  getMe(@CurrentUser('userId') userId: string): Promise<User> {
    return this.usersService.findOne(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiResponse({ status: 200, description: 'User found', type: User })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({
    status: 403,
    description: 'Access denied - admin or manager only',
  })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<User> {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a user' })
  @ApiResponse({ status: 200, description: 'User updated', type: User })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({
    status: 409,
    description: 'Email or username already registered',
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied - admin or manager only',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.usersService.update(id, updateUserDto);
  }

  @Patch(':id/change-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Change user password' })
  @ApiResponse({ status: 204, description: 'Password changed successfully' })
  @ApiResponse({ status: 401, description: 'Current password is incorrect' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({
    status: 403,
    description: 'Access denied - admin or manager only',
  })
  changePassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    return this.usersService.changePassword(id, changePasswordDto);
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate a user' })
  @ApiResponse({ status: 200, description: 'User deactivated', type: User })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({
    status: 403,
    description: 'Access denied - admin or manager only',
  })
  deactivate(@Param('id', ParseUUIDPipe) id: string): Promise<User> {
    return this.usersService.deactivate(id);
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Activate a user' })
  @ApiResponse({ status: 200, description: 'User activated', type: User })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({
    status: 403,
    description: 'Access denied - admin or manager only',
  })
  activate(@Param('id', ParseUUIDPipe) id: string): Promise<User> {
    return this.usersService.activate(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a user' })
  @ApiResponse({ status: 204, description: 'User removed successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({
    status: 403,
    description: 'Access denied - admin or manager only',
  })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.usersService.remove(id);
  }
}
