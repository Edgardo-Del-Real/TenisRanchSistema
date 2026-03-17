import { Usuario } from './usuario.entity';
export declare class PagoLuz {
    id: string;
    monto: number;
    fecha_pago: Date;
    descripcion: string;
    registrado_por: string;
    registrado_por_usuario: Usuario;
}
