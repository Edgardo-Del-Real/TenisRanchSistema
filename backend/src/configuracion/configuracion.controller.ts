import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ConfiguracionService } from './configuracion.service';
import { UpdateConfiguracionDto } from './dto/update-configuracion.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Rol } from '../common/enums/rol.enum';

@Controller('configuracion')
@UseGuards(JwtAuthGuard)
export class ConfiguracionController {
  constructor(private readonly configuracionService: ConfiguracionService) {}

  @Get()
  getConfiguracion() {
    return this.configuracionService.getConfiguracion();
  }

  @Put()
  @UseGuards(RolesGuard)
  @Roles(Rol.ADMINISTRADOR)
  updateConfiguracion(@Body() dto: UpdateConfiguracionDto) {
    return this.configuracionService.updateConfiguracion(dto);
  }
}
