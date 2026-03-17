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
  type: 'postgres',
  url: configService.get<string>('DATABASE_URL'),
  ssl:
    configService.get<string>('NODE_ENV') === 'production'
      ? { rejectUnauthorized: false }
      : false,
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
});
