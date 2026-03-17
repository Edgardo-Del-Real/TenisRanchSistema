import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CuotasService, CuotaFiltros } from './cuotas.service';
import { CreatePagoCuotaDto } from './dto/create-pago-cuota.dto';
import { GenerarCuotasDto } from './dto/generar-cuotas.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Rol } from '../common/enums/rol.enum';
import { EstadoCuota } from '../common/enums/estado-cuota.enum';

@Controller('cuotas')
@UseGuards(JwtAuthGuard)
export class CuotasController {
  constructor(private readonly cuotasService: CuotasService) {}

  @Get()
  async findAll(@Query() query: any, @Request() req: any) {
    const filtros: CuotaFiltros = {};

    if (query.nombre) filtros.nombre = query.nombre;
    if (query.apellido) filtros.apellido = query.apellido;
    if (query.estado && Object.values(EstadoCuota).includes(query.estado)) {
      filtros.estado = query.estado;
    }
    if (query.fechaDesde) filtros.fechaDesde = query.fechaDesde;
    if (query.fechaHasta) filtros.fechaHasta = query.fechaHasta;

    return this.cuotasService.findAll(filtros, req.user.userId, req.user.rol);
  }

  @Post('generar')
  @UseGuards(RolesGuard)
  @Roles(Rol.ADMINISTRADOR)
  async generarCuotas(@Body() dto: GenerarCuotasDto) {
    return this.cuotasService.generarCuotasManuales(dto.monto);
  }

  @Post(':id/pagos')
  @UseGuards(RolesGuard)
  @Roles(Rol.ADMINISTRADOR)
  async registrarPago(
    @Param('id') cuotaId: string,
    @Body() dto: CreatePagoCuotaDto,
    @Request() req: any,
  ) {
    return this.cuotasService.registrarPago(cuotaId, dto, req.user.userId);
  }

  @Get(':id/pagos')
  async getPagos(@Param('id') cuotaId: string, @Request() req: any) {
    return this.cuotasService.getPagos(cuotaId, req.user.userId, req.user.rol);
  }
}