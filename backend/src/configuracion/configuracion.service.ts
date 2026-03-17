import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfiguracionClub } from '../entities/configuracion-club.entity';
import { UpdateConfiguracionDto } from './dto/update-configuracion.dto';

@Injectable()
export class ConfiguracionService {
  constructor(
    @InjectRepository(ConfiguracionClub)
    private readonly configuracionRepository: Repository<ConfiguracionClub>,
  ) {}

  async getConfiguracion(): Promise<ConfiguracionClub> {
    const config = await this.configuracionRepository.findOne({
      where: {},
      order: { updated_at: 'DESC' },
    });

    if (!config) {
      throw new NotFoundException({
        error: {
          code: 'CONFIGURACION_NO_ENCONTRADA',
          message: 'No se encontró la configuración del club.',
        },
      });
    }

    return config;
  }

  async updateConfiguracion(
    dto: UpdateConfiguracionDto,
  ): Promise<ConfiguracionClub> {
    // Get the singleton configuration record
    let config = await this.configuracionRepository.findOne({
      where: {},
      order: { updated_at: 'DESC' },
    });

    if (!config) {
      // Create initial configuration if it doesn't exist
      config = this.configuracionRepository.create(dto);
    } else {
      // Update existing configuration
      config.apertura = dto.apertura;
      config.cierre = dto.cierre;
      config.luz_inicio = dto.luz_inicio;
      config.luz_fin = dto.luz_fin;
      config.duracion_semana_min = dto.duracion_semana_min;
      config.duracion_finde_min = dto.duracion_finde_min;
    }

    return this.configuracionRepository.save(config);
  }
}
