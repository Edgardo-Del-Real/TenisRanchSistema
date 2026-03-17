import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cancha } from '../entities/cancha.entity';
import { HistorialCancha } from '../entities/historial-cancha.entity';
import { CanchasController } from './canchas.controller';
import { CanchasService } from './canchas.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Cancha, HistorialCancha]),
    AuthModule,
  ],
  controllers: [CanchasController],
  providers: [CanchasService],
  exports: [CanchasService],
})
export class CanchasModule {}
