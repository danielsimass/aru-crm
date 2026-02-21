import { IsEmail, IsNotEmpty, IsString, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ValidateCodeDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email',
  })
  @IsNotEmpty({ message: 'E-mail é obrigatório' })
  @IsEmail({}, { message: 'E-mail inválido' })
  email: string;

  @ApiProperty({
    example: '123456',
    description: '6-digit code received by email',
    minLength: 6,
    maxLength: 6,
  })
  @IsNotEmpty({ message: 'Código é obrigatório' })
  @IsString({ message: 'Código deve ser um texto' })
  @Length(6, 6, { message: 'Código deve ter exatamente 6 dígitos' })
  @Matches(/^\d{6}$/, { message: 'Código deve conter apenas números' })
  secureCode: string;
}
