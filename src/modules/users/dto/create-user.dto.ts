import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RoleType } from '../enums/role.enum';

export class CreateUserDto {
  @ApiProperty({ example: 'John Doe', description: 'Full name of the user' })
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @IsString({ message: 'Nome deve ser um texto' })
  name: string;

  @ApiProperty({ example: 'john.doe@example.com', description: 'User email' })
  @IsNotEmpty({ message: 'E-mail é obrigatório' })
  @IsEmail({}, { message: 'E-mail inválido' })
  email: string;

  @ApiProperty({ example: 'johndoe', description: 'Unique username' })
  @IsNotEmpty({ message: 'Nome de usuário é obrigatório' })
  @IsString({ message: 'Nome de usuário deve ser um texto' })
  username: string;

  @ApiProperty({
    example: 'SecurePassword123',
    description:
      'User password (optional). Min 8 chars, at least 1 letter and 1 number.',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Senha deve ser um texto' })
  @MinLength(8, { message: 'Senha deve ter no mínimo 8 caracteres' })
  @MaxLength(128, { message: 'Senha deve ter no máximo 128 caracteres' })
  @Matches(/\d/, { message: 'Senha deve conter pelo menos um número' })
  @Matches(/[a-zA-Z]/, { message: 'Senha deve conter pelo menos uma letra' })
  password?: string;

  @ApiProperty({
    example: 'user',
    description: 'User role',
    enum: RoleType,
  })
  @IsNotEmpty({ message: 'Perfil é obrigatório' })
  @IsEnum(RoleType, {
    message: 'Perfil deve ser um valor válido: admin, manager, user',
  })
  role: RoleType;
}
