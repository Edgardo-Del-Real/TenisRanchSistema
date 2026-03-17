import { Turno } from './turno.entity';
import { Usuario } from './usuario.entity';
export declare class PagoTurno {
    id: string;
    turno_id: string;
    turno: Turno;
    monto: number;
    metodo_pago: string;
    fecha_pago: Date;
    registrado_por: string;
    registrado_por_usuario: Usuario;
}
