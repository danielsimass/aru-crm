import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty({ example: 'uuid-user-id', description: 'User ID' })
  userId: string;

  @ApiProperty({ example: 'John Doe', description: 'User name' })
  name: string;

  @ApiProperty({ example: 'john.doe@example.com', description: 'User email' })
  email: string;

  @ApiProperty({ example: 'admin', description: 'User role' })
  role: string;

  @ApiProperty({
    example: false,
    description: 'Indicates if it is the user first login',
  })
  isFirstLogin?: boolean;

  @ApiProperty({
    example: false,
    description: 'Indicates if the user needs to set password',
  })
  requiresPasswordSetup?: boolean;
}
