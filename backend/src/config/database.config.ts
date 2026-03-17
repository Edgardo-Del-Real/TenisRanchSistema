import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import {
  Usuario,
  Cancha,
  HistorialCancha,
  Turno,
  Cuota,
  PagoCuota,
  Tarifa,
  ConfiguracionClub,
  PagoLuz,
  PagoTurno,
} from '../entities';

export const getDatabaseConfig = (configService: ConfigService): TypeOrmModuleOptions => ({
  type: 'mssql',
  host: configService.get<string>('DB_HOST', 'localhost'),
  port: parseInt(configService.get<string>('DB_PORT', '1433'), 10),
  username: configService.get<string>('DB_USER', 'sa'),
  password: configService.get<string>('DB_PASSWORD', ''),
  database: configService.get<string>('DB_NAME', 'club_tenis'),
  entities: [
    Usuario,
    Cancha,
    HistorialCancha,
    Turno,
    Cuota,
    PagoCuota,
    Tarifa,
    ConfiguracionClub,
    PagoLuz,
    PagoTurno,
  ],
  synchronize: configService.get<string>('NODE_ENV') !== 'production',
  logging: configService.get<string>('NODE_ENV') === 'development',
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
});
