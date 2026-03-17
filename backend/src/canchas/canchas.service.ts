import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cancha } from '../entities/cancha.entity';
import { HistorialCancha } from '../entities/historial-cancha.entity';
import { UpdateEstadoCanchaDto } from './dto/update-estado-cancha.dto';

@Injectable()
export class CanchasService {
  constructor(
    @InjectRepository(Cancha)
    private readonly canchaRepository: Repository<Cancha>,
    @InjectRepository(HistorialCancha)
    private readonly historialRepository: Repository<HistorialCancha>,
  ) {}

  async findAll(): Promise<Cancha[]> {
    return this.canchaRepository.find();
  }

  async updateEstado(
    id: string,
    dto: UpdateEstadoCanchaDto,
    userId: string,
  ): Promise<Cancha> {
    const cancha = await this.canchaRepository.findOne({ where: { id } });
    if (!cancha) {
      throw new NotFoundException({
        error: {
          code: 'CANCHA_NO_ENCONTRADA',
          message: 'Cancha no encontrada.',
        },
      });
    }

    const estadoAnterior = cancha.estado;

    // Create history record
    const historial = this.historialRepository.create({
      cancha_id: id,
      estado_anterior: estadoAnterior,
      estado_nuevo: dto.estado,
      razon: dto.razon,
      cambiado_por: userId,
    });
    await this.historialRepository.save(historial);

    // Update cancha
    cancha.estado = dto.estado;
    cancha.razon_estado = dto.razon;
    return this.canchaRepository.save(cancha);
  }

  async getHistorial(id: string): Promise<HistorialCancha[]> {
    const cancha = await this.canchaRepository.findOne({ where: { id } });
    if (!cancha) {
      throw new NotFoundException({
        error: {
          code: 'CANCHA_NO_ENCONTRADA',
          message: 'Cancha no encontrada.',
        },
      });
    }

    return this.historialRepository.find({
      where: { cancha_id: id },
      relations: ['cambiado_por_usuario'],
      order: { fecha_cambio: 'DESC' },
    });
  }
}
