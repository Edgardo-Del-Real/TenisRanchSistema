import { Repository } from 'typeorm';
import { Usuario } from '../entities/usuario.entity';
import { Turno } from '../entities/turno.entity';
import { Cuota } from '../entities/cuota.entity';
import { PagoCuota } from '../entities/pago-cuota.entity';
import { PagoLuz } from '../entities/pago-luz.entity';
import { PagoTurno } from '../entities/pago-turno.entity';
import { Cancha } from '../entities/cancha.entity';
import { FiltroEstadisticasDto } from './dto/filtro-estadisticas.dto';
export declare class EstadisticasService {
    private usuarioRepository;
    private turnoRepository;
    private cuotaRepository;
    private pagoCuotaRepository;
    private pagoLuzRepository;
    private pagoTurnoRepository;
    private canchaRepository;
    constructor(usuarioRepository: Repository<Usuario>, turnoRepository: Repository<Turno>, cuotaRepository: Repository<Cuota>, pagoCuotaRepository: Repository<PagoCuota>, pagoLuzRepository: Repository<PagoLuz>, pagoTurnoRepository: Repository<PagoTurno>, canchaRepository: Repository<Cancha>);
    getEstadisticasGenerales(filtros: FiltroEstadisticasDto): Promise<{
        totalSociosActivos: number;
        totalTurnos: number;
        canchasMasUtilizadas: any[];
        horasPico: any[];
    }>;
    getEstadisticasFinancieras(filtros: FiltroEstadisticasDto): Promise<{
        recaudacionCuotas: number;
        recaudacionTurnosNoSocio: number;
        cargosLuz: number;
        pagosLuz: number;
    }>;
}
