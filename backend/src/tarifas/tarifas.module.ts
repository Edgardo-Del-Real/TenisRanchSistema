import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tarifa } from '../entities/tarifa.entity';
import { TarifasController } from './tarifas.controller';
import { TarifasService } from './tarifas.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tarifa]),
    AuthModule,
  ],
  controllers: [TarifasController],
  providers: [TarifasService],
  exports: [TarifasService],
})
export class TarifasModule {}
