import { EstadoCuota } from '../common/enums/estado-cuota.enum';
import { Usuario } from './usuario.entity';
export declare class Cuota {
    id: string;
    socio_id: string;
    socio: Usuario;
    mes: number;
    anio: number;
    monto_total: number;
    monto_abonado: number;
    estado: EstadoCuota;
    created_at: Date;
}
