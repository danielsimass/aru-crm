import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'johndoe',
    description: 'Email or username (login accepts both)',
  })
  @IsNotEmpty({ message: 'E-mail ou nome de usuário é obrigatório' })
  @IsString({ message: 'Deve ser um texto' })
  login: string;

  @ApiProperty({ example: 'SecurePassword123!', description: 'User password' })
  @IsNotEmpty({ message: 'Senha é obrigatória' })
  @IsString({ message: 'Senha deve ser um texto' })
  password: string;
}
