import { UsuariosService } from './usuarios.service';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { UpdateRolDto } from './dto/update-rol.dto';
import { UpdatePerfilDto } from './dto/update-perfil.dto';
import { Rol } from '../common/enums/rol.enum';
export declare class UsuariosController {
    private readonly usuariosService;
    constructor(usuariosService: UsuariosService);
    findAll(nombre?: string, apellido?: string, activo?: string, rol?: Rol): Promise<Omit<import("../entities").Usuario, "password_hash">[]>;
    updatePerfil(req: any, dto: UpdatePerfilDto): Promise<Omit<import("../entities").Usuario, "password_hash">>;
    solicitarSocio(): {
        whatsappUrl: string;
    };
    findOne(id: string): Promise<Omit<import("../entities").Usuario, "password_hash">>;
    update(id: string, dto: UpdateUsuarioDto): Promise<Omit<import("../entities").Usuario, "password_hash">>;
    updateRol(id: string, dto: UpdateRolDto, req: any): Promise<Omit<import("../entities").Usuario, "password_hash">>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
