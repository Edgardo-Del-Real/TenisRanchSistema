import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EstadisticasController } from './estadisticas.controller';
import { EstadisticasService } from './estadisticas.service';
import { Usuario } from '../entities/usuario.entity';
import { Turno } from '../entities/turno.entity';
import { Cuota } from '../entities/cuota.entity';
import { PagoCuota } from '../entities/pago-cuota.entity';
import { PagoLuz } from '../entities/pago-luz.entity';
import { PagoTurno } from '../entities/pago-turno.entity';
import { Cancha } from '../entities/cancha.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Usuario,
      Turno,
      Cuota,
      PagoCuota,
      PagoLuz,
      PagoTurno,
      Cancha,
    ]),
  ],
  controllers: [EstadisticasController],
  providers: [EstadisticasService],
})
export class EstadisticasModule {}