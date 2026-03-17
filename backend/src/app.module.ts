import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { getDatabaseConfig } from './config/database.config';
import { AuthModule } from './auth/auth.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { CanchasModule } from './canchas/canchas.module';
import { TarifasModule } from './tarifas/tarifas.module';
import { ConfiguracionModule } from './configuracion/configuracion.module';
import { TurnosModule } from './turnos/turnos.module';
import { CuotasModule } from './cuotas/cuotas.module';
import { PagosModule } from './pagos/pagos.module';
import { EstadisticasModule } from './estadisticas/estadisticas.module';
import { SeedModule } from './seed/seed.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID
          ? '.env.test'
          : '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getDatabaseConfig,
    }),
    ScheduleModule.forRoot(),
    SeedModule,
    AuthModule,
    UsuariosModule,
    CanchasModule,
    TarifasModule,
    ConfiguracionModule,
    TurnosModule,
    CuotasModule,
    PagosModule,
    EstadisticasModule,
  ],
})
export class AppModule {}
