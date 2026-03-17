import { Cuota } from './cuota.entity';
import { Usuario } from './usuario.entity';
export declare class PagoCuota {
    id: string;
    cuota_id: string;
    cuota: Cuota;
    monto: number;
    fecha_pago: Date;
    registrado_por: string;
    registrado_por_usuario: Usuario;
}
