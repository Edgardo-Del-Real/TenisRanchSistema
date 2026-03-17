import { EstadisticasService } from './estadisticas.service';
import { FiltroEstadisticasDto } from './dto/filtro-estadisticas.dto';
export declare class EstadisticasController {
    private readonly estadisticasService;
    constructor(estadisticasService: EstadisticasService);
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
