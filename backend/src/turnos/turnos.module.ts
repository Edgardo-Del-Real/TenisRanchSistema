import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TurnosController } from './turnos.controller';
import { TurnosService } from './turnos.service';
import { Turno } from '../entities/turno.entity';
import { Cancha } from '../entities/cancha.entity';
import { Cuota } from '../entities/cuota.entity';
import { PagoTurno } from '../entities/pago-turno.entity';
import { ConfiguracionModule } from '../configuracion/configuracion.module';
import { TarifasModule } from '../tarifas/tarifas.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Turno, Cancha, Cuota, PagoTurno]),
    ConfiguracionModule,
    TarifasModule,
  ],
  controllers: [TurnosController],
  providers: [TurnosService],
  exports: [TurnosService],
})
export class TurnosModule {}
