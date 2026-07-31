import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';
import type { UpdateRoleInput } from '@redsis/contracts';

/** Implementa `UpdateRoleInput`. Los roles no se eliminan: se desactivan. */
export class UpdateRoleDto implements UpdateRoleInput {
  @ApiPropertyOptional({ example: 'coordinador' })
  @IsOptional()
  @IsString()
  @Length(3, 50, { message: 'El nombre debe tener entre 3 y 50 caracteres' })
  name?: string;

  @ApiPropertyOptional({ example: 'Coordina la operación de una zona' })
  @IsOptional()
  @IsString()
  @Length(0, 200, { message: 'La descripción no puede pasar de 200 caracteres' })
  description?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
