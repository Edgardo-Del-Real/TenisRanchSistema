import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { EstadisticasService } from './estadisticas.service';
import { FiltroEstadisticasDto } from './dto/filtro-estadisticas.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Rol } from '../common/enums/rol.enum';

@Controller('estadisticas')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Rol.ADMINISTRADOR)
export class EstadisticasController {
  constructor(private readonly estadisticasService: EstadisticasService) {}

  @Get('generales')
  async getEstadisticasGenerales(@Query() filtros: FiltroEstadisticasDto) {
    return this.estadisticasService.getEstadisticasGenerales(filtros);
  }

  @Get('financieras')
  async getEstadisticasFinancieras(@Query() filtros: FiltroEstadisticasDto) {
    return this.estadisticasService.getEstadisticasFinancieras(filtros);
  }
}