import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email of the account to recover',
  })
  @IsNotEmpty({ message: 'E-mail é obrigatório' })
  @IsEmail({}, { message: 'E-mail inválido' })
  email: string;
}
