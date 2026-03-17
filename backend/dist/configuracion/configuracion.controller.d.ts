import { ConfiguracionService } from './configuracion.service';
import { UpdateConfiguracionDto } from './dto/update-configuracion.dto';
export declare class ConfiguracionController {
    private readonly configuracionService;
    constructor(configuracionService: ConfiguracionService);
    getConfiguracion(): Promise<import("../entities").ConfiguracionClub>;
    updateConfiguracion(dto: UpdateConfiguracionDto): Promise<import("../entities").ConfiguracionClub>;
}
