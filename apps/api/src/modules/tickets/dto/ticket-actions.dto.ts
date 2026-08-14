import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString, MaxLength, MinLength } from 'class-validator';
import {
  TICKET_PRIORITIES,
  TICKET_WORKFLOW_SEQUENCE,
  type AddTicketObservationInput,
  type AssignTechnicianInput,
  type ChangeTicketPriorityInput,
  type TicketPriority,
  type TicketWorkflowStep,
} from '@redsis/contracts';

/**
 * Entrada validada de las acciones sobre un ticket.
 *
 * Cada DTO implementa el tipo del contrato compartido, así que si el esquema Zod
 * del frontend cambia y estos no, el backend deja de compilar. Es lo que evita
 * que la pantalla y la API discrepen sobre qué es válido (ver CODING_STANDARDS.md).
 *
 * Los catálogos se recorren desde el contrato en lugar de repetirse: un estado o
 * un paso nuevo queda admitido sin tocar este archivo.
 */

export class AssignTechnicianDto implements AssignTechnicianInput {
  @ApiProperty({ example: 'Ana Pérez' })
  @IsString()
  @MinLength(1, { message: 'Elige un técnico' })
  technicianName!: string;
}

export class ChangeTicketPriorityDto implements ChangeTicketPriorityInput {
  @ApiProperty({ enum: Object.values(TICKET_PRIORITIES) })
  @IsIn(Object.values(TICKET_PRIORITIES), { message: 'La prioridad no existe en el catálogo' })
  priority!: TicketPriority;
}

export class AddTicketObservationDto implements AddTicketObservationInput {
  @ApiProperty({ maxLength: 500 })
  @IsString()
  @MinLength(3, { message: 'Escribe la observación' })
  @MaxLength(500, { message: 'La observación no puede pasar de 500 caracteres' })
  note!: string;
}

export class CompleteWorkflowStepDto {
  @ApiProperty({ enum: [...TICKET_WORKFLOW_SEQUENCE] })
  @IsIn([...TICKET_WORKFLOW_SEQUENCE], { message: 'El paso no existe en el flujo' })
  step!: TicketWorkflowStep;
}
