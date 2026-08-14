import { BadRequestException } from '@nestjs/common';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import {
  MAX_PAGE_SIZE,
  queryFilterSchema,
  type DataQuery,
  type QueryFilter,
} from '@redsis/contracts';

/**
 * Consulta de un listado de tickets.
 *
 * Los criterios viajan planos en la URL y no en un cuerpo porque listar es una
 * lectura: así la petición se puede compartir, volver a ella y cachear. Lo único
 * que no cabe plano son los filtros, que van como JSON y se validan con el mismo
 * esquema que usa el frontend para construirlos.
 *
 * El orden se expresa con un solo criterio (`sortBy` y `sortDir`). El contrato
 * admite varios porque el framework de tablas los soporta, pero ninguna pantalla
 * ordena hoy por más de una columna y una URL con orden múltiple sería ilegible.
 */
export class ListTicketsQueryDto {
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ minimum: 1, maximum: MAX_PAGE_SIZE, default: 25 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  pageSize: number = 25;

  @ApiPropertyOptional({ description: 'Búsqueda general sobre las columnas visibles' })
  @IsOptional()
  @IsString()
  search: string = '';

  @ApiPropertyOptional({ description: 'Identificador de la columna por la que ordenar' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ description: 'Orden descendente', default: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  sortDesc: boolean = false;

  @ApiPropertyOptional({
    description:
      'Condiciones en JSON, combinadas con Y. Ejemplo: [{"id":"f1","columnId":"status","operator":"es","value":"en-ruta"}]',
  })
  @IsOptional()
  @IsString()
  filters?: string;

  /**
   * Traduce la petición al contrato compartido.
   *
   * La conversión vive aquí y no en el servicio para que el servicio no sepa que
   * existe HTTP: recibe una `DataQuery` igual que la recibiría de una cola o de
   * una tarea programada.
   */
  toDataQuery(): DataQuery {
    return {
      page: this.page,
      pageSize: this.pageSize,
      search: this.search,
      sorting: this.sortBy === undefined ? [] : [{ id: this.sortBy, desc: this.sortDesc }],
      filters: this.parseFilters(),
    };
  }

  private parseFilters(): QueryFilter[] {
    if (this.filters === undefined || this.filters.trim().length === 0) {
      return [];
    }

    const parsed = this.parseJson(this.filters);
    const result = queryFilterSchema.array().safeParse(parsed);

    if (!result.success) {
      throw new BadRequestException('Las condiciones del filtro no tienen la forma esperada.');
    }

    return result.data;
  }

  private parseJson(raw: string): unknown {
    try {
      return JSON.parse(raw);
    } catch {
      throw new BadRequestException('Las condiciones del filtro no son un JSON válido.');
    }
  }
}
