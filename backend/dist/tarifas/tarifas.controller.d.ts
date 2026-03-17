import { TarifasService } from './tarifas.service';
import { UpdateTarifaDto } from './dto/update-tarifa.dto';
export declare class TarifasController {
    private readonly tarifasService;
    constructor(tarifasService: TarifasService);
    findVigentes(): Promise<import("../entities").Tarifa[]>;
    updateTarifa(tipo: string, dto: UpdateTarifaDto, req: any): Promise<import("../entities").Tarifa>;
    getHistorial(fechaDesde?: string, fechaHasta?: string, montoMin?: string, montoMax?: string): Promise<import("../entities").Tarifa[]>;
}
