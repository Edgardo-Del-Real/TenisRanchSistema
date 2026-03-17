import { Repository } from 'typeorm';
import { Cuota } from '../entities/cuota.entity';
import { PagoCuota } from '../entities/pago-cuota.entity';
import { Usuario } from '../entities/usuario.entity';
import { Tarifa } from '../entities/tarifa.entity';
import { EstadoCuota } from '../common/enums/estado-cuota.enum';
import { Rol } from '../common/enums/rol.enum';
import { CreatePagoCuotaDto } from './dto/create-pago-cuota.dto';
export interface CuotaFiltros {
    nombre?: string;
    apellido?: string;
    estado?: EstadoCuota;
    fechaDesde?: string;
    fechaHasta?: string;
}
export declare class CuotasService {
    private readonly cuotaRepository;
    private readonly pagoCuotaRepository;
    private readonly usuarioRepository;
    private readonly tarifaRepository;
    constructor(cuotaRepository: Repository<Cuota>, pagoCuotaRepository: Repository<PagoCuota>, usuarioRepository: Repository<Usuario>, tarifaRepository: Repository<Tarifa>);
    generarCuotasMensuales(): Promise<void>;
    findAll(filtros: CuotaFiltros, userId?: string, userRole?: Rol): Promise<any[]>;
    registrarPago(cuotaId: string, dto: CreatePagoCuotaDto, registradoPor: string): Promise<{
        message: string;
        cuota: any;
    }>;
    generarCuotasManuales(monto: number): Promise<{
        message: string;
        cuotasGeneradas: number;
    }>;
    getCuotasImpagas(socioId: string): Promise<number>;
    getPagos(cuotaId: string, userId: string, userRole: Rol): Promise<any[]>;
}
