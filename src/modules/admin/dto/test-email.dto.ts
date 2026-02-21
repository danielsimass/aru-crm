import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class TestEmailDto {
  @ApiProperty({ example: 'user@example.com', description: 'Recipient email' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: 'João Silva', description: 'Recipient name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'pt-BR', description: 'Template locale' })
  @IsOptional()
  @IsString()
  locale?: string;

  @ApiPropertyOptional({
    example: 'https://app.example.com/set-password?token=xxx',
    description: 'Link for set password (used in WELCOME template)',
  })
  @IsOptional()
  @IsString()
  setPasswordUrl?: string;

  @ApiPropertyOptional({ description: 'Correlation id for logging' })
  @IsOptional()
  @IsString()
  correlationId?: string;
}
