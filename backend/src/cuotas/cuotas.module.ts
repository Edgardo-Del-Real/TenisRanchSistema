import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CuotasController } from './cuotas.controller';
import { CuotasService } from './cuotas.service';
import { Cuota } from '../entities/cuota.entity';
import { PagoCuota } from '../entities/pago-cuota.entity';
import { Usuario } from '../entities/usuario.entity';
import { Tarifa } from '../entities/tarifa.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Cuota, PagoCuota, Usuario, Tarifa])],
  controllers: [CuotasController],
  providers: [CuotasService],
  exports: [CuotasService],
})
export class CuotasModule {}