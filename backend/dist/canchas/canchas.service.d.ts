import { Repository } from 'typeorm';
import { Cancha } from '../entities/cancha.entity';
import { HistorialCancha } from '../entities/historial-cancha.entity';
import { UpdateEstadoCanchaDto } from './dto/update-estado-cancha.dto';
export declare class CanchasService {
    private readonly canchaRepository;
    private readonly historialRepository;
    constructor(canchaRepository: Repository<Cancha>, historialRepository: Repository<HistorialCancha>);
    findAll(): Promise<Cancha[]>;
    updateEstado(id: string, dto: UpdateEstadoCanchaDto, userId: string): Promise<Cancha>;
    getHistorial(id: string): Promise<HistorialCancha[]>;
}
