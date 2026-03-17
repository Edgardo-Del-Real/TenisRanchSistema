import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CanchasService } from './canchas.service';
import { UpdateEstadoCanchaDto } from './dto/update-estado-cancha.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Rol } from '../common/enums/rol.enum';

@Controller('canchas')
@UseGuards(JwtAuthGuard)
export class CanchasController {
  constructor(private readonly canchasService: CanchasService) {}

  @Get()
  findAll() {
    return this.canchasService.findAll();
  }

  @Patch(':id/estado')
  @UseGuards(RolesGuard)
  @Roles(Rol.ADMINISTRADOR)
  updateEstado(
    @Param('id') id: string,
    @Body() dto: UpdateEstadoCanchaDto,
    @Request() req: any,
  ) {
    return this.canchasService.updateEstado(id, dto, req.user.id);
  }

  @Get(':id/historial')
  @UseGuards(RolesGuard)
  @Roles(Rol.ADMINISTRADOR)
  getHistorial(@Param('id') id: string) {
    return this.canchasService.getHistorial(id);
  }
}
