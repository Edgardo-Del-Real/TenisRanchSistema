import { Repository } from 'typeorm';
import { Usuario } from '../entities/usuario.entity';
import { Cancha } from '../entities/cancha.entity';
import { ConfiguracionClub } from '../entities/configuracion-club.entity';
import { Tarifa } from '../entities/tarifa.entity';
export declare class SeedService {
    private readonly usuarioRepository;
    private readonly canchaRepository;
    private readonly configuracionRepository;
    private readonly tarifaRepository;
    private readonly logger;
    constructor(usuarioRepository: Repository<Usuario>, canchaRepository: Repository<Cancha>, configuracionRepository: Repository<ConfiguracionClub>, tarifaRepository: Repository<Tarifa>);
    seedDefaultAdmin(): Promise<void>;
    private seedCanchas;
    private seedConfiguracion;
    private seedTarifas;
}
