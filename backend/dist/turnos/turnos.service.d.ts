import { Repository } from 'typeorm';
import { Turno } from '../entities/turno.entity';
import { Cancha } from '../entities/cancha.entity';
import { Cuota } from '../entities/cuota.entity';
import { PagoTurno } from '../entities/pago-turno.entity';
import { ConfiguracionService } from '../configuracion/configuracion.service';
import { TarifasService } from '../tarifas/tarifas.service';
import { CreateTurnoDto } from './dto/create-turno.dto';
import { Rol } from '../common/enums/rol.enum';
export declare class TurnosService {
    private readonly turnoRepository;
    private readonly canchaRepository;
    private readonly cuotaRepository;
    private readonly pagoTurnoRepository;
    private readonly configuracionService;
    private readonly tarifasService;
    constructor(turnoRepository: Repository<Turno>, canchaRepository: Repository<Cancha>, cuotaRepository: Repository<Cuota>, pagoTurnoRepository: Repository<PagoTurno>, configuracionService: ConfiguracionService, tarifasService: TarifasService);
    create(dto: CreateTurnoDto, userId: string, userRole: Rol): Promise<any>;
    cancelTurno(turnoId: string, userId: string, userRole: Rol): Promise<any>;
    findTurnos(userId: string, userRole: Rol, filters: {
        nombre?: string;
        apellido?: string;
        fechaDesde?: string;
        fechaHasta?: string;
    }): Promise<any[]>;
    findHistorial(userId: string, userRole: Rol, filters: {
        nombre?: string;
        apellido?: string;
        fechaDesde?: string;
        fechaHasta?: string;
    }): Promise<any[]>;
    private formatTurnoResponse;
    private getTimeString;
    private overlapsTimeRange;
}
