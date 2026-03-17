import { TurnosService } from './turnos.service';
import { CreateTurnoDto } from './dto/create-turno.dto';
export declare class TurnosController {
    private readonly turnosService;
    constructor(turnosService: TurnosService);
    create(dto: CreateTurnoDto, req: any): Promise<any>;
    findTurnos(req: any, nombre?: string, apellido?: string, fechaDesde?: string, fechaHasta?: string): Promise<any[]>;
    findHistorial(req: any, nombre?: string, apellido?: string, fechaDesde?: string, fechaHasta?: string): Promise<any[]>;
    cancel(id: string, req: any): Promise<any>;
}
