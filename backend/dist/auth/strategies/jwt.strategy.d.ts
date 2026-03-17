import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { Usuario } from '../../entities/usuario.entity';
import { TokenBlacklistService } from '../token-blacklist.service';
export interface JwtPayload {
    sub: string;
    email: string;
    rol: string;
}
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly tokenBlacklistService;
    private readonly usuarioRepository;
    constructor(configService: ConfigService, tokenBlacklistService: TokenBlacklistService, usuarioRepository: Repository<Usuario>);
    validate(req: any, payload: JwtPayload): Promise<{
        userId: string;
        id: string;
        nombre: string;
        apellido: string;
        email: string;
        telefono: string;
        rol: import("../../common/enums").Rol;
        activo: boolean;
        created_at: Date;
        updated_at: Date;
    }>;
}
export {};
