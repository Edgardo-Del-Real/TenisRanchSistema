import { TipoTarifa } from '../common/enums/tipo-tarifa.enum';
import { Usuario } from './usuario.entity';
export declare class Tarifa {
    id: string;
    tipo: TipoTarifa;
    valor: number;
    vigente_desde: Date;
    modificado_por: string;
    modificado_por_usuario: Usuario;
}
