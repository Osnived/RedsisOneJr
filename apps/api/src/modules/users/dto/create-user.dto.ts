import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEmail, IsString, IsUUID, Length, Matches } from 'class-validator';
import type { CreateUserInput } from '@redsis/contracts';

/**
 * Implementa `CreateUserInput` de @redsis/contracts: si el contrato compartido
 * con el frontend cambia, esta clase deja de compilar. Las reglas se declaran
 * con class-validator porque además alimentan la documentación Swagger.
 */
export class CreateUserDto implements CreateUserInput {
  @ApiProperty({ example: 'tecnico@redsis.com' })
  @IsEmail({}, { message: 'El correo no es válido' })
  email!: string;

  @ApiProperty({ example: 'Ana Pérez' })
  @IsString()
  @Length(3, 120, { message: 'El nombre debe tener entre 3 y 120 caracteres' })
  fullName!: string;

  @ApiProperty({
    example: 'Redsis2026',
    description: 'Mínimo 8 caracteres, con mayúscula, minúscula y número',
  })
  @IsString()
  @Length(8, 72, { message: 'La contraseña debe tener entre 8 y 72 caracteres' })
  @Matches(/[a-z]/, { message: 'La contraseña debe incluir al menos una letra minúscula' })
  @Matches(/[A-Z]/, { message: 'La contraseña debe incluir al menos una letra mayúscula' })
  @Matches(/\d/, { message: 'La contraseña debe incluir al menos un número' })
  password!: string;

  @ApiPropertyOptional({ type: [String], format: 'uuid', default: [] })
  @IsArray()
  @IsUUID('4', { each: true, message: 'Cada rol debe ser un identificador válido' })
  roleIds: string[] = [];
}
