import { CanchasService } from './canchas.service';
import { UpdateEstadoCanchaDto } from './dto/update-estado-cancha.dto';
export declare class CanchasController {
    private readonly canchasService;
    constructor(canchasService: CanchasService);
    findAll(): Promise<import("../entities").Cancha[]>;
    updateEstado(id: string, dto: UpdateEstadoCanchaDto, req: any): Promise<import("../entities").Cancha>;
    getHistorial(id: string): Promise<import("../entities").HistorialCancha[]>;
}
