import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { Usuario } from '../entities/usuario.entity';
import { Rol } from '../common/enums/rol.enum';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<Omit<Usuario, 'password_hash'>> {
    const existing = await this.usuarioRepository.findOne({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException({
        error: {
          code: 'EMAIL_DUPLICADO',
          message: 'El correo ya está en uso.',
        },
      });
    }

    const password_hash = await bcrypt.hash(dto.password, 10);

    const usuario = this.usuarioRepository.create({
      nombre: dto.nombre,
      apellido: dto.apellido,
      email: dto.email,
      password_hash,
      telefono: dto.telefono,
      rol: Rol.NO_SOCIO,
    });

    const saved = await this.usuarioRepository.save(usuario);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash: _, ...result } = saved;
    return result;
  }

  async login(dto: LoginDto): Promise<{ access_token: string }> {
    const usuario = await this.usuarioRepository.findOne({
      where: { email: dto.email },
    });

    const invalidError = new UnauthorizedException({
      error: {
        code: 'CREDENCIALES_INVALIDAS',
        message: 'Credenciales inválidas.',
      },
    });

    if (!usuario) {
      throw invalidError;
    }

    const passwordValid = await bcrypt.compare(
      dto.password,
      usuario.password_hash,
    );

    if (!passwordValid) {
      throw invalidError;
    }

    if (!usuario.activo) {
      throw invalidError;
    }

    const payload = {
      sub: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
    };

    const access_token = this.jwtService.sign(payload);

    return { access_token };
  }
}

