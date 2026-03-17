import { Controller, Post, Body, UseGuards, Request, Delete, Param, Get, Query } from '@nestjs/common';
import { TurnosService } from './turnos.service';
import { CreateTurnoDto } from './dto/create-turno.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Rol } from '../common/enums/rol.enum';

@Controller('turnos')
@UseGuards(JwtAuthGuard)
export class TurnosController {
  constructor(private readonly turnosService: TurnosService) {}

  @Post()
  create(@Body() dto: CreateTurnoDto, @Request() req) {
    return this.turnosService.create(dto, req.user.userId, req.user.rol);
  }

  @Get()
  findTurnos(
    @Request() req,
    @Query('nombre') nombre?: string,
    @Query('apellido') apellido?: string,
    @Query('fecha_desde') fechaDesde?: string,
    @Query('fecha_hasta') fechaHasta?: string,
  ) {
    return this.turnosService.findTurnos(
      req.user.userId,
      req.user.rol,
      { nombre, apellido, fechaDesde, fechaHasta }
    );
  }

  @Get('historial')
  findHistorial(
    @Request() req,
    @Query('nombre') nombre?: string,
    @Query('apellido') apellido?: string,
    @Query('fecha_desde') fechaDesde?: string,
    @Query('fecha_hasta') fechaHasta?: string,
  ) {
    return this.turnosService.findHistorial(
      req.user.userId,
      req.user.rol,
      { nombre, apellido, fechaDesde, fechaHasta }
    );
  }

  @Delete(':id')
  cancel(@Param('id') id: string, @Request() req) {
    return this.turnosService.cancelTurno(id, req.user.userId, req.user.rol);
  }
}
