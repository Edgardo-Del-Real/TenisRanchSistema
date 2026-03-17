import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PagosController } from './pagos.controller';
import { PagosService } from './pagos.service';
import { PagoTurno, PagoLuz, Turno } from '../entities';

@Module({
  imports: [TypeOrmModule.forFeature([PagoTurno, PagoLuz, Turno])],
  controllers: [PagosController],
  providers: [PagosService],
})
export class PagosModule {}