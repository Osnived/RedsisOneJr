import { ApiProperty } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsIn, IsString, Length } from 'class-validator';
import {
  ACCESS_CHANGE_REASON_MAX,
  ALL_APP_MODULES,
  ALL_PERMISSIONS,
  type UpdateRoleAccessInput,
} from '@redsis/contracts';

/**
 * Implementa `UpdateRoleAccessInput`.
 *
 * Se envían los conjuntos completos y no las diferencias: el servidor necesita
 * el antes y el después para auditarlos, y así dos personas editando a la vez no
 * producen un estado que nadie pidió.
 *
 * Los valores admitidos se derivan de los catálogos compartidos, así que añadir
 * un módulo o un permiso no exige tocar este archivo.
 */
export class UpdateRoleAccessDto implements UpdateRoleAccessInput {
  @ApiProperty({ type: [String], enum: ALL_APP_MODULES, example: ['dashboard', 'tickets'] })
  @IsArray()
  @ArrayUnique({ message: 'Hay módulos repetidos' })
  @IsIn(ALL_APP_MODULES, { each: true, message: 'Hay módulos que no existen en el catálogo' })
  modules!: string[];

  @ApiProperty({ type: [String], enum: ALL_PERMISSIONS, example: ['tickets.view'] })
  @IsArray()
  @ArrayUnique({ message: 'Hay permisos repetidos' })
  @IsIn(ALL_PERMISSIONS, { each: true, message: 'Hay permisos que no existen en el catálogo' })
  permissions!: string[];

  @ApiProperty({
    example: 'El supervisor deja de gestionar usuarios tras la reorganización',
    description: 'Obligatorio: un cambio de accesos sin explicación no sirve para auditar',
  })
  @IsString()
  @Length(1, ACCESS_CHANGE_REASON_MAX, { message: 'El motivo del cambio es obligatorio' })
  reason!: string;
}
