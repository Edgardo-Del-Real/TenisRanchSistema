import { Repository, DataSource } from 'typeorm';
import { Usuario } from '../entities/usuario.entity';
export declare function cleanupTestUsers(usuarioRepository: Repository<Usuario>): Promise<void>;
export declare function cleanupAllTestData(dataSource: DataSource): Promise<void>;
