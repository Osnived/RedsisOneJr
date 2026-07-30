import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import type { PaginationInput } from '@redsis/contracts';

/**
 * Paginación reutilizable por cualquier módulo.
 *
 * Implementa `PaginationInput` de @redsis/contracts para que el contrato
 * compartido con el frontend no pueda desviarse sin romper la compilación.
 */
export class PaginationQueryDto implements PaginationInput {
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 25 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number = 25;
}
