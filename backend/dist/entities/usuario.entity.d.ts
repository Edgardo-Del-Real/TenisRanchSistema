import { Rol } from '../common/enums/rol.enum';
export declare class Usuario {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
    password_hash: string;
    telefono: string;
    rol: Rol;
    activo: boolean;
    created_at: Date;
    updated_at: Date;
}
