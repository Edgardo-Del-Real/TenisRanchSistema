import { Repository } from 'typeorm';
import { ConfiguracionClub } from '../entities/configuracion-club.entity';
import { UpdateConfiguracionDto } from './dto/update-configuracion.dto';
export declare class ConfiguracionService {
    private readonly configuracionRepository;
    constructor(configuracionRepository: Repository<ConfiguracionClub>);
    getConfiguracion(): Promise<ConfiguracionClub>;
    updateConfiguracion(dto: UpdateConfiguracionDto): Promise<ConfiguracionClub>;
}
