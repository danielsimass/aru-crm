import {
  IsNotEmpty,
  IsString,
  IsUUID,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetFirstPasswordDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'User ID (from query param ?userId=... in /first-login)',
  })
  @IsNotEmpty({ message: 'ID do usuário é obrigatório' })
  @IsUUID('4', { message: 'ID do usuário inválido' })
  userId: string;

  @ApiProperty({
    example: 'NewSecurePassword123',
    description: 'New password. Min 8 chars, at least 1 letter and 1 number.',
  })
  @IsNotEmpty({ message: 'Senha é obrigatória' })
  @IsString({ message: 'Senha deve ser um texto' })
  @MinLength(8, { message: 'Senha deve ter no mínimo 8 caracteres' })
  @MaxLength(128, { message: 'Senha deve ter no máximo 128 caracteres' })
  @Matches(/\d/, { message: 'Senha deve conter pelo menos um número' })
  @Matches(/[a-zA-Z]/, { message: 'Senha deve conter pelo menos uma letra' })
  password: string;

  @ApiProperty({
    example: '123456',
    description: 'Verification code sent by email',
    minLength: 6,
    maxLength: 6,
  })
  @IsNotEmpty({ message: 'Código de verificação é obrigatório' })
  @IsString({ message: 'Código de verificação deve ser um texto' })
  @Length(6, 6, { message: 'Código deve ter exatamente 6 dígitos' })
  @Matches(/^\d{6}$/, { message: 'Código deve conter apenas números' })
  secureCode: string;
}
