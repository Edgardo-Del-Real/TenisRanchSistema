import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Usuario } from '../entities/usuario.entity';
import { Rol } from '../common/enums/rol.enum';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { UpdateRolDto } from './dto/update-rol.dto';
import { UpdatePerfilDto } from './dto/update-perfil.dto';

export interface UsuarioFiltros {
  nombre?: string;
  apellido?: string;
  activo?: boolean;
  rol?: Rol;
}

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
  ) {}

  async findAll(filtros: UsuarioFiltros): Promise<Omit<Usuario, 'password_hash'>[]> {
    const where: any = {};

    if (filtros.nombre !== undefined) {
      where.nombre = Like(`%${filtros.nombre}%`);
    }
    if (filtros.apellido !== undefined) {
      where.apellido = Like(`%${filtros.apellido}%`);
    }
    if (filtros.activo !== undefined) {
      where.activo = filtros.activo;
    }
    if (filtros.rol !== undefined) {
      where.rol = filtros.rol;
    }

    const usuarios = await this.usuarioRepository.find({ where });
    return usuarios.map((u) => this.omitPassword(u));
  }

  async findOne(id: string): Promise<Omit<Usuario, 'password_hash'>> {
    const usuario = await this.usuarioRepository.findOne({ where: { id } });
    if (!usuario) {
      throw new NotFoundException({
        error: {
          code: 'USUARIO_NO_ENCONTRADO',
          message: 'Usuario no encontrado.',
        },
      });
    }
    return this.omitPassword(usuario);
  }

  async update(id: string, dto: UpdateUsuarioDto): Promise<Omit<Usuario, 'password_hash'>> {
    const usuario = await this.usuarioRepository.findOne({ where: { id } });
    if (!usuario) {
      throw new NotFoundException({
        error: {
          code: 'USUARIO_NO_ENCONTRADO',
          message: 'Usuario no encontrado.',
        },
      });
    }

    if (dto.nombre !== undefined) usuario.nombre = dto.nombre;
    if (dto.apellido !== undefined) usuario.apellido = dto.apellido;
    if (dto.telefono !== undefined) usuario.telefono = dto.telefono;

    const updated = await this.usuarioRepository.save(usuario);
    return this.omitPassword(updated);
  }

  async updateRol(
    id: string,
    dto: UpdateRolDto,
    requestingUserId: string,
  ): Promise<Omit<Usuario, 'password_hash'>> {
    if (id === requestingUserId) {
      throw new ForbiddenException({
        error: {
          code: 'ROL_PROPIO',
          message: 'No puede modificar su propio rol.',
        },
      });
    }

    const usuario = await this.usuarioRepository.findOne({ where: { id } });
    if (!usuario) {
      throw new NotFoundException({
        error: {
          code: 'USUARIO_NO_ENCONTRADO',
          message: 'Usuario no encontrado.',
        },
      });
    }

    usuario.rol = dto.rol;
    const updated = await this.usuarioRepository.save(usuario);
    return this.omitPassword(updated);
  }

  async remove(id: string): Promise<{ message: string }> {
    const usuario = await this.usuarioRepository.findOne({ where: { id } });
    if (!usuario) {
      throw new NotFoundException({
        error: {
          code: 'USUARIO_NO_ENCONTRADO',
          message: 'Usuario no encontrado.',
        },
      });
    }

    usuario.activo = false;
    await this.usuarioRepository.save(usuario);
    return { message: 'Usuario dado de baja exitosamente' };
  }

  async updatePerfil(
    userId: string,
    dto: UpdatePerfilDto,
  ): Promise<Omit<Usuario, 'password_hash'>> {
    const usuario = await this.usuarioRepository.findOne({ where: { id: userId } });
    if (!usuario) {
      throw new NotFoundException({
        error: {
          code: 'USUARIO_NO_ENCONTRADO',
          message: 'Usuario no encontrado.',
        },
      });
    }

    if (dto.nombre !== undefined) usuario.nombre = dto.nombre;
    if (dto.telefono !== undefined) usuario.telefono = dto.telefono;
    if (dto.password !== undefined) {
      usuario.password_hash = await bcrypt.hash(dto.password, 10);
    }

    const updated = await this.usuarioRepository.save(usuario);
    return this.omitPassword(updated);
  }

  solicitarSocio(): { whatsappUrl: string } {
    const whatsappUrl =
      'https://wa.me/5491100000000?text=Hola%2C%20quisiera%20solicitar%20el%20cambio%20de%20rol%20a%20Socio.';
    return { whatsappUrl };
  }

  private omitPassword(usuario: Usuario): Omit<Usuario, 'password_hash'> {
    const { password_hash, ...rest } = usuario;
    return rest as Omit<Usuario, 'password_hash'>;
  }
}

