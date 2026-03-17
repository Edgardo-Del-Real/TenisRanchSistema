import { Repository } from 'typeorm';
import { Tarifa } from '../entities/tarifa.entity';
import { UpdateTarifaDto } from './dto/update-tarifa.dto';
export declare class TarifasService {
    private readonly tarifaRepository;
    constructor(tarifaRepository: Repository<Tarifa>);
    findVigentes(): Promise<Tarifa[]>;
    updateTarifa(tipo: string, dto: UpdateTarifaDto, userId: string): Promise<Tarifa>;
    getHistorial(fechaDesde?: string, fechaHasta?: string, montoMin?: number, montoMax?: number): Promise<Tarifa[]>;
}
