import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Tarifa } from '../entities/tarifa.entity';
import { TipoTarifa } from '../common/enums/tipo-tarifa.enum';
import { UpdateTarifaDto } from './dto/update-tarifa.dto';

@Injectable()
export class TarifasService {
  constructor(
    @InjectRepository(Tarifa)
    private readonly tarifaRepository: Repository<Tarifa>,
  ) {}

  async findVigentes(): Promise<Tarifa[]> {
    const tipos = Object.values(TipoTarifa);
    const tarifas: Tarifa[] = [];

    for (const tipo of tipos) {
      const tarifa = await this.tarifaRepository.findOne({
        where: { tipo },
        order: { vigente_desde: 'DESC' },
      });
      if (tarifa) {
        tarifas.push(tarifa);
      }
    }

    return tarifas;
  }

  async updateTarifa(
    tipo: string,
    dto: UpdateTarifaDto,
    userId: string,
  ): Promise<Tarifa> {
    // Validate tipo
    if (!Object.values(TipoTarifa).includes(tipo as TipoTarifa)) {
      throw new BadRequestException({
        error: {
          code: 'TIPO_TARIFA_INVALIDO',
          message: 'Tipo de tarifa inválido.',
        },
      });
    }

    // Create new tarifa record
    const nuevaTarifa = this.tarifaRepository.create({
      tipo: tipo as TipoTarifa,
      valor: dto.valor,
      vigente_desde: new Date(),
      modificado_por: userId,
    });

    return this.tarifaRepository.save(nuevaTarifa);
  }

  async getHistorial(
    fechaDesde?: string,
    fechaHasta?: string,
    montoMin?: number,
    montoMax?: number,
  ): Promise<Tarifa[]> {
    const queryBuilder = this.tarifaRepository
      .createQueryBuilder('tarifa')
      .leftJoinAndSelect('tarifa.modificado_por_usuario', 'usuario')
      .orderBy('tarifa.vigente_desde', 'DESC');

    if (fechaDesde && fechaHasta) {
      queryBuilder.andWhere('tarifa.vigente_desde BETWEEN :fechaDesde AND :fechaHasta', {
        fechaDesde: new Date(fechaDesde),
        fechaHasta: new Date(fechaHasta),
      });
    } else if (fechaDesde) {
      queryBuilder.andWhere('tarifa.vigente_desde >= :fechaDesde', {
        fechaDesde: new Date(fechaDesde),
      });
    } else if (fechaHasta) {
      queryBuilder.andWhere('tarifa.vigente_desde <= :fechaHasta', {
        fechaHasta: new Date(fechaHasta),
      });
    }

    if (montoMin !== undefined && montoMax !== undefined) {
      queryBuilder.andWhere('tarifa.valor BETWEEN :montoMin AND :montoMax', {
        montoMin,
        montoMax,
      });
    } else if (montoMin !== undefined) {
      queryBuilder.andWhere('tarifa.valor >= :montoMin', { montoMin });
    } else if (montoMax !== undefined) {
      queryBuilder.andWhere('tarifa.valor <= :montoMax', { montoMax });
    }

    return queryBuilder.getMany();
  }
}
