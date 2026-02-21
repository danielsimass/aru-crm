import {
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({
    example: 'OldPassword123',
    description: 'Current user password',
  })
  @IsNotEmpty({ message: 'Senha atual é obrigatória' })
  @IsString({ message: 'Senha atual deve ser um texto' })
  currentPassword: string;

  @ApiProperty({
    example: 'NewSecurePassword123',
    description: 'New password. Min 8 chars, at least 1 letter and 1 number.',
  })
  @IsNotEmpty({ message: 'Nova senha é obrigatória' })
  @IsString({ message: 'Nova senha deve ser um texto' })
  @MinLength(8, { message: 'Nova senha deve ter no mínimo 8 caracteres' })
  @MaxLength(128, { message: 'Nova senha deve ter no máximo 128 caracteres' })
  @Matches(/\d/, { message: 'Nova senha deve conter pelo menos um número' })
  @Matches(/[a-zA-Z]/, {
    message: 'Nova senha deve conter pelo menos uma letra',
  })
  newPassword: string;
}
