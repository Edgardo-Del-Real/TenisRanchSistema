import { PagosService } from './pagos.service';
import { CreatePagoTurnoDto } from './dto/create-pago-turno.dto';
import { CreatePagoLuzDto } from './dto/create-pago-luz.dto';
export declare class PagosController {
    private readonly pagosService;
    constructor(pagosService: PagosService);
    registrarPagoTurno(createPagoTurnoDto: CreatePagoTurnoDto, req: any): Promise<import("../entities").PagoTurno>;
    registrarPagoLuz(createPagoLuzDto: CreatePagoLuzDto, req: any): Promise<import("../entities").PagoLuz>;
    obtenerPagosLuz(): Promise<import("../entities").PagoLuz[]>;
}
