import { Repository } from 'typeorm';
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
export declare class UsuariosService {
    private readonly usuarioRepository;
    constructor(usuarioRepository: Repository<Usuario>);
    findAll(filtros: UsuarioFiltros): Promise<Omit<Usuario, 'password_hash'>[]>;
    findOne(id: string): Promise<Omit<Usuario, 'password_hash'>>;
    update(id: string, dto: UpdateUsuarioDto): Promise<Omit<Usuario, 'password_hash'>>;
    updateRol(id: string, dto: UpdateRolDto, requestingUserId: string): Promise<Omit<Usuario, 'password_hash'>>;
    remove(id: string): Promise<{
        message: string;
    }>;
    updatePerfil(userId: string, dto: UpdatePerfilDto): Promise<Omit<Usuario, 'password_hash'>>;
    solicitarSocio(): {
        whatsappUrl: string;
    };
    private omitPassword;
}
