import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  APP_MODULES,
  PERMISSIONS,
  type PaginatedResult,
  type Ticket,
  type TicketColumnConfig,
} from '@redsis/contracts';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequireModule } from '../../common/decorators/require-module.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import type { RequestUser } from '../../common/types/request-user';
import { ListTicketsQueryDto } from './dto/list-tickets.dto';
import {
  AddTicketObservationDto,
  AssignTechnicianDto,
  ChangeTicketPriorityDto,
  CompleteWorkflowStepDto,
} from './dto/ticket-actions.dto';
import type { TicketDetail, TicketEvent, TicketFieldChange } from './ticket.types';
import { TicketsService, type TicketActor } from './tickets.service';

/**
 * Endpoints de Tickets.
 *
 * Las dos puertas de la autorización se aplican aquí igual que en el resto de la
 * plataforma: `@RequireModule` decide si Tickets existe para el usuario y
 * `@RequirePermissions` qué puede hacer dentro. Consultar exige `tickets.view`;
 * operar, `tickets.edit`. Responden 403 aunque se llame al endpoint directamente,
 * que es lo que convierte la comprobación del frontend en una comodidad y no en
 * la defensa.
 *
 * El identificador no se valida como UUID: un ticket de un proveedor externo puede
 * identificarse con un código propio (`BRD-GVF3CC`, `10025489`) y exigir un formato
 * ataría la API a cómo numera un origen concreto.
 */
@ApiTags('Tickets')
@ApiBearerAuth()
@RequireModule(APP_MODULES.TICKETS)
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.TICKETS_VIEW)
  @ApiOperation({ summary: 'Listar tickets con búsqueda, orden, filtros y paginación' })
  list(@Query() query: ListTicketsQueryDto): Promise<PaginatedResult<Ticket>> {
    return this.ticketsService.list(query.toDataQuery());
  }

  @Get('columns')
  @RequirePermissions(PERMISSIONS.TICKETS_VIEW)
  @ApiOperation({
    summary: 'Estructura de columnas del proyecto',
    description:
      'Columnas estándar y adicionales de la fuente activa, ya normalizadas. No incluye ningún identificador del proveedor.',
  })
  describeColumns(): Promise<TicketColumnConfig[]> {
    return this.ticketsService.describeColumns();
  }

  @Get('technicians')
  @RequirePermissions(PERMISSIONS.TICKETS_VIEW)
  @ApiOperation({ summary: 'Técnicos a los que se puede asignar un servicio' })
  listAssignableTechnicians(): Promise<string[]> {
    return this.ticketsService.listAssignableTechnicians();
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.TICKETS_VIEW)
  @ApiOperation({ summary: 'Obtener un ticket completo' })
  findDetail(@Param('id') id: string): Promise<TicketDetail> {
    return this.ticketsService.findDetail(id);
  }

  @Get(':id/timeline')
  @RequirePermissions(PERMISSIONS.TICKETS_VIEW)
  @ApiOperation({ summary: 'Historia operativa del ticket' })
  findTimeline(@Param('id') id: string): Promise<TicketEvent[]> {
    return this.ticketsService.findTimeline(id);
  }

  @Get(':id/audit-log')
  @RequirePermissions(PERMISSIONS.TICKETS_VIEW)
  @ApiOperation({ summary: 'Cambios auditados de los datos del ticket' })
  findAuditLog(@Param('id') id: string): Promise<TicketFieldChange[]> {
    return this.ticketsService.findAuditLog(id);
  }

  @Patch(':id/technician')
  @RequirePermissions(PERMISSIONS.TICKETS_EDIT)
  @ApiOperation({ summary: 'Asignar o reasignar el técnico del servicio' })
  assignTechnician(
    @Param('id') id: string,
    @Body() body: AssignTechnicianDto,
    @CurrentUser() user: RequestUser,
  ): Promise<TicketDetail> {
    return this.ticketsService.assignTechnician(id, body, actorOf(user));
  }

  @Patch(':id/priority')
  @RequirePermissions(PERMISSIONS.TICKETS_EDIT)
  @ApiOperation({ summary: 'Cambiar la prioridad del servicio' })
  changePriority(
    @Param('id') id: string,
    @Body() body: ChangeTicketPriorityDto,
    @CurrentUser() user: RequestUser,
  ): Promise<TicketDetail> {
    return this.ticketsService.changePriority(id, body, actorOf(user));
  }

  @Post(':id/observations')
  @RequirePermissions(PERMISSIONS.TICKETS_EDIT)
  @ApiOperation({ summary: 'Agregar una observación al timeline' })
  addObservation(
    @Param('id') id: string,
    @Body() body: AddTicketObservationDto,
    @CurrentUser() user: RequestUser,
  ): Promise<TicketDetail> {
    return this.ticketsService.addObservation(id, body, actorOf(user));
  }

  @Post(':id/workflow')
  @RequirePermissions(PERMISSIONS.TICKETS_EDIT)
  @ApiOperation({
    summary: 'Avanzar el flujo de la intervención',
    description:
      'Solo se acepta el paso que corresponde según lo ya completado. Cualquier otro responde 409.',
  })
  completeWorkflowStep(
    @Param('id') id: string,
    @Body() body: CompleteWorkflowStepDto,
    @CurrentUser() user: RequestUser,
  ): Promise<TicketDetail> {
    return this.ticketsService.completeWorkflowStep(id, body.step, actorOf(user));
  }
}

/**
 * Quién ejecuta la operación, tomado del token.
 *
 * El actor **nunca** llega por parámetro: el frontend no debe poder decir quién
 * hizo algo. Es la diferencia entre una auditoría y un campo de texto.
 */
function actorOf(user: RequestUser): TicketActor {
  return { id: user.id, name: user.email };
}
