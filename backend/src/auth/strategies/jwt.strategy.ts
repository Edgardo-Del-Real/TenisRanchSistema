import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../../entities/usuario.entity';
import { TokenBlacklistService } from '../token-blacklist.service';

export interface JwtPayload {
  sub: string;
  email: string;
  rol: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly tokenBlacklistService: TokenBlacklistService,
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(req: any, payload: JwtPayload) {
    const authHeader: string = req.headers?.['authorization'] ?? '';
    const token = authHeader.split(' ')[1];

    if (token && this.tokenBlacklistService.isBlacklisted(token)) {
      throw new UnauthorizedException({
        error: {
          code: 'CREDENCIALES_INVALIDAS',
          message: 'Credenciales inválidas.',
        },
      });
    }

    // Get full user object from database
    const user = await this.usuarioRepository.findOne({
      where: { id: payload.sub, activo: true },
    });

    if (!user) {
      throw new UnauthorizedException({
        error: {
          code: 'CREDENCIALES_INVALIDAS',
          message: 'Credenciales inválidas.',
        },
      });
    }

    // Remove password from response and add userId for controller compatibility
    const { password_hash, ...userWithoutPassword } = user;
    return {
      ...userWithoutPassword,
      userId: user.id, // Add userId for controller compatibility
    };
  }
}
