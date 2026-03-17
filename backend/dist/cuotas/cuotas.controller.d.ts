import { CuotasService } from './cuotas.service';
import { CreatePagoCuotaDto } from './dto/create-pago-cuota.dto';
import { GenerarCuotasDto } from './dto/generar-cuotas.dto';
export declare class CuotasController {
    private readonly cuotasService;
    constructor(cuotasService: CuotasService);
    findAll(query: any, req: any): Promise<any[]>;
    generarCuotas(dto: GenerarCuotasDto): Promise<{
        message: string;
        cuotasGeneradas: number;
    }>;
    registrarPago(cuotaId: string, dto: CreatePagoCuotaDto, req: any): Promise<{
        message: string;
        cuota: any;
    }>;
    getPagos(cuotaId: string, req: any): Promise<any[]>;
}
