import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { Usuario } from '../entities/usuario.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthService {
    private readonly usuarioRepository;
    private readonly jwtService;
    constructor(usuarioRepository: Repository<Usuario>, jwtService: JwtService);
    register(dto: RegisterDto): Promise<Omit<Usuario, 'password_hash'>>;
    login(dto: LoginDto): Promise<{
        access_token: string;
    }>;
}
