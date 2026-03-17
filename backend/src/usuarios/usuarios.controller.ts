import {
  Controller,
  Get,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { UpdateRolDto } from './dto/update-rol.dto';
import { UpdatePerfilDto } from './dto/update-perfil.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { OwnerOrAdminGuard } from '../auth/guards/owner-or-admin.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Rol } from '../common/enums/rol.enum';

@Controller('usuarios')
@UseGuards(JwtAuthGuard)
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Rol.ADMINISTRADOR)
  findAll(
    @Query('nombre') nombre?: string,
    @Query('apellido') apellido?: string,
    @Query('activo') activo?: string,
    @Query('rol') rol?: Rol,
  ) {
    const activoBoolean =
      activo === 'true' ? true : activo === 'false' ? false : undefined;

    return this.usuariosService.findAll({
      nombre,
      apellido,
      activo: activoBoolean,
      rol,
    });
  }

  // Must be defined before GET :id to avoid route conflicts
  @Patch('perfil')
  updatePerfil(@Request() req: any, @Body() dto: UpdatePerfilDto) {
    return this.usuariosService.updatePerfil(req.user.userId, dto);
  }

  @Get('solicitar-socio')
  solicitarSocio() {
    return this.usuariosService.solicitarSocio();
  }

  @Get(':id')
  @UseGuards(OwnerOrAdminGuard)
  findOne(@Param('id') id: string) {
    return this.usuariosService.findOne(id);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(Rol.ADMINISTRADOR)
  update(@Param('id') id: string, @Body() dto: UpdateUsuarioDto) {
    return this.usuariosService.update(id, dto);
  }

  @Patch(':id/rol')
  @UseGuards(RolesGuard)
  @Roles(Rol.ADMINISTRADOR)
  updateRol(
    @Param('id') id: string,
    @Body() dto: UpdateRolDto,
    @Request() req: any,
  ) {
    return this.usuariosService.updateRol(id, dto, req.user.userId);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Rol.ADMINISTRADOR)
  remove(@Param('id') id: string) {
    return this.usuariosService.remove(id);
  }
}
