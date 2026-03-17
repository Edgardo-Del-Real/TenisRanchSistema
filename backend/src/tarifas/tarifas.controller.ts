import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { TarifasService } from './tarifas.service';
import { UpdateTarifaDto } from './dto/update-tarifa.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Rol } from '../common/enums/rol.enum';

@Controller('tarifas')
@UseGuards(JwtAuthGuard)
export class TarifasController {
  constructor(private readonly tarifasService: TarifasService) {}

  @Get()
  findVigentes() {
    return this.tarifasService.findVigentes();
  }

  @Put(':tipo')
  @UseGuards(RolesGuard)
  @Roles(Rol.ADMINISTRADOR)
  updateTarifa(
    @Param('tipo') tipo: string,
    @Body() dto: UpdateTarifaDto,
    @Request() req: any,
  ) {
    return this.tarifasService.updateTarifa(tipo, dto, req.user.userId);
  }

  @Get('historial')
  @UseGuards(RolesGuard)
  @Roles(Rol.ADMINISTRADOR)
  getHistorial(
    @Query('fecha_desde') fechaDesde?: string,
    @Query('fecha_hasta') fechaHasta?: string,
    @Query('monto_min') montoMin?: string,
    @Query('monto_max') montoMax?: string,
  ) {
    return this.tarifasService.getHistorial(
      fechaDesde,
      fechaHasta,
      montoMin ? parseFloat(montoMin) : undefined,
      montoMax ? parseFloat(montoMax) : undefined,
    );
  }
}
