import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { Usuario } from '../entities/usuario.entity';
import { Cancha } from '../entities/cancha.entity';
import { ConfiguracionClub } from '../entities/configuracion-club.entity';
import { Tarifa } from '../entities/tarifa.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Usuario, Cancha, ConfiguracionClub, Tarifa])],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}