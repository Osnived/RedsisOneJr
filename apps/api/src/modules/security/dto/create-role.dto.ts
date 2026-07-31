import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';
import type { CreateRoleInput } from '@redsis/contracts';

/**
 * Implementa `CreateRoleInput` de @redsis/contracts: si el contrato compartido
 * con el frontend cambia, esta clase deja de compilar.
 */
export class CreateRoleDto implements CreateRoleInput {
  @ApiProperty({ example: 'coordinador' })
  @IsString()
  @Length(3, 50, { message: 'El nombre debe tener entre 3 y 50 caracteres' })
  name!: string;

  @ApiPropertyOptional({ example: 'Coordina la operación de una zona' })
  @IsOptional()
  @IsString()
  @Length(0, 200, { message: 'La descripción no puede pasar de 200 caracteres' })
  description?: string;
}
