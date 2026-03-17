import { EstadoTurno } from '../common/enums/estado-turno.enum';
import { Usuario } from './usuario.entity';
import { Cancha } from './cancha.entity';
import { PagoTurno } from './pago-turno.entity';
export declare class Turno {
    id: string;
    usuario_id: string;
    usuario: Usuario;
    cancha_id: string;
    cancha: Cancha;
    fecha_inicio: Date;
    fecha_fin: Date;
    requiere_luz: boolean;
    costo_turno: number;
    costo_luz: number;
    estado: EstadoTurno;
    cancelado_en: Date;
    cancelado_por: string;
    cancelado_por_usuario: Usuario;
    created_at: Date;
    pago_turno: PagoTurno;
}
