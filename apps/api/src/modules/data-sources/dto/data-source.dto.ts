import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  DATA_SOURCE_PROVIDERS,
  type CreateDataSourceInput,
  type DataSourceProvider,
  type TestDataSourceConnectionInput,
  type UpdateDataSourceInput,
} from '@redsis/contracts';

/**
 * Entrada validada de la administración de fuentes de datos.
 *
 * Cada DTO implementa el tipo del contrato compartido: si el esquema Zod que usa
 * la pantalla cambia y estos no, el backend deja de compilar.
 *
 * `credentials` viaja siempre de ida y nunca de vuelta. No hay ningún DTO de
 * respuesta que lo contenga porque no existe respuesta que lo lleve.
 */

export class CreateDataSourceDto implements CreateDataSourceInput {
  @ApiProperty({ example: 'Tickets Retail' })
  @IsString()
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  @MaxLength(80, { message: 'El nombre no puede pasar de 80 caracteres' })
  name!: string;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'La descripción no puede pasar de 200 caracteres' })
  description?: string;

  @ApiProperty({ enum: Object.values(DATA_SOURCE_PROVIDERS) })
  @IsIn(Object.values(DATA_SOURCE_PROVIDERS), {
    message: 'El proveedor no existe en el catálogo',
  })
  provider!: DataSourceProvider;

  @ApiPropertyOptional({
    description: 'Parámetros no sensibles del proveedor, por su clave',
    example: { baseUrl: 'https://one.redsis.app', boardId: 'BRD-GVF3CC' },
  })
  @IsOptional()
  @IsObject()
  settings: Record<string, string> = {};

  @ApiPropertyOptional({
    description: 'Valores sensibles, por su clave. Se guardan cifrados y no se devuelven nunca.',
  })
  @IsOptional()
  @IsObject()
  credentials: Record<string, string> = {};

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive: boolean = true;
}

/**
 * Cambios sobre una fuente existente.
 *
 * `provider` no se admite: cambiarlo dejaría la configuración y las columnas
 * apuntando a un origen que no las entiende. Se crea otra fuente y se retira la
 * anterior.
 */
export class UpdateDataSourceDto implements UpdateDataSourceInput {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  @MaxLength(80, { message: 'El nombre no puede pasar de 80 caracteres' })
  name?: string;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'La descripción no puede pasar de 200 caracteres' })
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  settings?: Record<string, string>;

  @ApiPropertyOptional({ description: 'Omitir para conservar las credenciales guardadas' })
  @IsOptional()
  @IsObject()
  credentials?: Record<string, string>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class TestDataSourceConnectionDto implements TestDataSourceConnectionInput {
  @ApiProperty({ enum: Object.values(DATA_SOURCE_PROVIDERS) })
  @IsIn(Object.values(DATA_SOURCE_PROVIDERS), {
    message: 'El proveedor no existe en el catálogo',
  })
  provider!: DataSourceProvider;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  settings: Record<string, string> = {};

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  credentials: Record<string, string> = {};

  @ApiPropertyOptional({
    description: 'Fuente guardada de la que tomar las credenciales que no se envíen',
  })
  @IsOptional()
  @IsUUID()
  dataSourceId?: string;
}
