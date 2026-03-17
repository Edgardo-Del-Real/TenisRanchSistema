import { Repository } from 'typeorm';
import { PagoTurno, PagoLuz, Turno } from '../entities';
import { CreatePagoTurnoDto } from './dto/create-pago-turno.dto';
import { CreatePagoLuzDto } from './dto/create-pago-luz.dto';
export declare class PagosService {
    private pagoTurnoRepository;
    private pagoLuzRepository;
    private turnoRepository;
    constructor(pagoTurnoRepository: Repository<PagoTurno>, pagoLuzRepository: Repository<PagoLuz>, turnoRepository: Repository<Turno>);
    registrarPagoTurno(createPagoTurnoDto: CreatePagoTurnoDto, userId: string): Promise<PagoTurno>;
    registrarPagoLuz(createPagoLuzDto: CreatePagoLuzDto, userId: string): Promise<PagoLuz>;
    obtenerPagosLuz(): Promise<PagoLuz[]>;
}
