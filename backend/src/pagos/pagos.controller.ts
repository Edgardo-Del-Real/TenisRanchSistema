import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { PagosService } from './pagos.service';
import { CreatePagoTurnoDto } from './dto/create-pago-turno.dto';
import { CreatePagoLuzDto } from './dto/create-pago-luz.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Rol } from '../common/enums/rol.enum';

@Controller('pagos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PagosController {
  constructor(private readonly pagosService: PagosService) {}

  @Post('turnos')
  @Roles(Rol.ADMINISTRADOR)
  async registrarPagoTurno(
    @Body() createPagoTurnoDto: CreatePagoTurnoDto,
    @Request() req,
  ) {
    return await this.pagosService.registrarPagoTurno(
      createPagoTurnoDto,
      req.user.userId,
    );
  }

  @Post('luz')
  @Roles(Rol.ADMINISTRADOR)
  async registrarPagoLuz(
    @Body() createPagoLuzDto: CreatePagoLuzDto,
    @Request() req,
  ) {
    return await this.pagosService.registrarPagoLuz(
      createPagoLuzDto,
      req.user.userId,
    );
  }

  @Get('luz')
  @Roles(Rol.ADMINISTRADOR)
  async obtenerPagosLuz() {
    return await this.pagosService.obtenerPagosLuz();
  }
}