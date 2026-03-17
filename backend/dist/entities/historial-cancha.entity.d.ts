import { EstadoCancha } from '../common/enums/estado-cancha.enum';
import { Cancha } from './cancha.entity';
import { Usuario } from './usuario.entity';
export declare class HistorialCancha {
    id: string;
    cancha_id: string;
    cancha: Cancha;
    estado_anterior: EstadoCancha;
    estado_nuevo: EstadoCancha;
    razon: string;
    cambiado_por: string;
    cambiado_por_usuario: Usuario;
    fecha_cambio: Date;
}
