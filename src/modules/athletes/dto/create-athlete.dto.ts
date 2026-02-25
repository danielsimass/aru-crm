import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  MinLength,
  ValidateBy,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { DominantHand } from '../enums/dominant-hand.enum';

const CPF_REGEX = /^\d{11}$|^\d{3}\.\d{3}\.\d{3}-\d{2}$/;

function isNotFutureDate(value: string): boolean {
  const date = new Date(value);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return date.getTime() <= today.getTime();
}

/**
 * Calculates age at the end of the current year (Dec 31).
 */
function getAgeAtEndOfYear(birthDate: string): number {
  const birth = new Date(birthDate);
  const year = new Date().getFullYear();
  const endOfYear = new Date(year, 11, 31);
  if (birth > endOfYear) return -1;
  const birthdayThisYear = new Date(year, birth.getMonth(), birth.getDate());
  let age = year - birth.getFullYear();
  if (birthdayThisYear > endOfYear) age--;
  return age;
}

/**
 * Returns true if the athlete is under 18 years old.
 */
function isUnder18(birthDate: string): boolean {
  const age = getAgeAtEndOfYear(birthDate);
  return age >= 0 && age < 18;
}

export class CreateAthleteDto {
  @ApiProperty({
    example: 'João Silva',
    description: 'Full name of the athlete',
  })
  @IsNotEmpty({ message: 'Nome completo é obrigatório' })
  @IsString()
  fullName: string;

  @ApiProperty({
    example: '2010-05-15',
    description: 'Birth date (YYYY-MM-DD)',
  })
  @IsNotEmpty({ message: 'Data de nascimento é obrigatória' })
  @IsDateString()
  @ValidateBy({
    name: 'isNotFutureDate',
    validator: {
      validate: (value: string) => isNotFutureDate(value),
      defaultMessage: () => 'Data de nascimento não pode ser no futuro',
    },
  })
  birthDate: string;

  @ApiProperty({ example: '11987654321', description: 'Phone number' })
  @IsNotEmpty({ message: 'Telefone é obrigatório' })
  @IsString()
  @MinLength(10, { message: 'Telefone deve ter no mínimo 10 caracteres' })
  phone: string;

  @ApiPropertyOptional({
    example: 'Maria Silva',
    description: 'Guardian full name (required if athlete is under 18)',
  })
  @ValidateIf((o) => isUnder18(o.birthDate))
  @IsNotEmpty({
    message: 'Nome do responsável é obrigatório para atletas menores de 18 anos',
  })
  @IsString()
  guardianName?: string;

  @ApiPropertyOptional({
    example: '11912345678',
    description: 'Guardian phone number (required if athlete is under 18)',
  })
  @ValidateIf((o) => isUnder18(o.birthDate))
  @IsNotEmpty({
    message:
      'Telefone do responsável é obrigatório para atletas menores de 18 anos',
  })
  @IsString()
  @MinLength(10, {
    message: 'Telefone do responsável deve ter no mínimo 10 caracteres',
  })
  guardianPhone?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the athlete is active',
    default: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value === 'boolean') return value;
    if (value === 'true') return true;
    if (value === 'false') return false;
    return undefined;
  })
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    example: 'athlete@example.com',
    description: 'Email address',
  })
  @IsNotEmpty({ message: 'E-mail é obrigatório' })
  @IsEmail({}, { message: 'E-mail deve ser um endereço válido' })
  email: string;

  @ApiPropertyOptional({
    example: '123.456.789-09',
    description: 'CPF (11 digits or XXX.XXX.XXX-XX)',
  })
  @IsOptional()
  @IsString()
  @Matches(CPF_REGEX, {
    message: 'CPF deve ter 11 dígitos ou estar no formato XXX.XXX.XXX-XX',
  })
  cpf?: string;

  @ApiPropertyOptional({ example: 175, description: 'Height in cm' })
  @IsOptional()
  @Transform(({ value }) =>
    value === undefined || value === null || value === ''
      ? undefined
      : Number(value),
  )
  @IsNumber()
  @Min(50)
  @Max(250)
  heightCm?: number;

  @ApiPropertyOptional({ example: 70, description: 'Weight in kg' })
  @IsOptional()
  @Transform(({ value }) =>
    value === undefined || value === null || value === ''
      ? undefined
      : Number(value),
  )
  @IsNumber()
  @Min(20)
  @Max(300)
  weightKg?: number;

  @ApiPropertyOptional({ enum: DominantHand })
  @IsOptional()
  @IsEnum(DominantHand)
  dominantHand?: DominantHand;

  @ApiPropertyOptional({ example: 'Allergic to peanuts' })
  @IsOptional()
  @IsString()
  notes?: string;
}
