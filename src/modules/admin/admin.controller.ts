import { Body, Controller, Logger, Post, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JobsService } from '../jobs/jobs.service';
import { JobType } from '../jobs/jobs.types';
import { TestEmailDto } from './dto/test-email.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RoleType } from '../users/enums/role.enum';

@ApiTags('admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(RolesGuard)
@Roles(RoleType.ADMIN)
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(
    private readonly jobsService: JobsService,
    private readonly config: ConfigService,
  ) {}

  @Post('test-email')
  @ApiOperation({ summary: 'Enqueue a test welcome email (demo)' })
  @ApiResponse({ status: 201, description: 'Job enqueued' })
  async testEmail(@Body() dto: TestEmailDto) {
    this.logger.log(`Enqueueing test email job for ${dto.email}`);

    const job = await this.jobsService.enqueue(JobType.EMAIL_SEND, {
      recipient: {
        kind: 'USER',
        id: 'test',
        email: dto.email,
        name: dto.name ?? dto.email,
      },
      template: { key: 'WELCOME', locale: dto.locale },
      data: {
        name: dto.name ?? dto.email,
        setPasswordUrl:
          dto.setPasswordUrl ??
          `${this.config.get<string>('FRONTEND_URL', 'http://localhost:3001')}/auth/set-password`,
      },
      meta: dto.correlationId
        ? { correlationId: dto.correlationId }
        : undefined,
    });

    this.logger.log(`Job created: id=${job.id} status=${job.status}`);
    return { jobId: job.id, status: job.status };
  }
}
