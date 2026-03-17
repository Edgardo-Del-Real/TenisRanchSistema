import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Cuota } from '../entities/cuota.entity';
import { PagoCuota } from '../entities/pago-cuota.entity';
import { Usuario } from '../entities/usuario.entity';
import { Tarifa } from '../entities/tarifa.entity';
import { EstadoCuota } from '../common/enums/estado-cuota.enum';
import { Rol } from '../common/enums/rol.enum';
import { TipoTarifa } from '../common/enums/tipo-tarifa.enum';
import { CreatePagoCuotaDto } from './dto/create-pago-cuota.dto';

export interface CuotaFiltros {
  nombre?: string;
  apellido?: string;
  estado?: EstadoCuota;
  fechaDesde?: string;
  fechaHasta?: string;
}

@Injectable()
export class CuotasService {
  constructor(
    @InjectRepository(Cuota)
    private readonly cuotaRepository: Repository<Cuota>,
    @InjectRepository(PagoCuota)
    private readonly pagoCuotaRepository: Repository<PagoCuota>,
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    @InjectRepository(Tarifa)
    private readonly tarifaRepository: Repository<Tarifa>,
  ) {}

  // Cron job que se ejecuta el primer día de cada mes a las 00:01
  @Cron('1 0 1 * *')
  async generarCuotasMensuales(): Promise<void> {
    const now = new Date();
    const mes = now.getMonth() + 1; // getMonth() returns 0-11
    const anio = now.getFullYear();

    // Obtener tarifa vigente de cuota
    const tarifaCuota = await this.tarifaRepository.findOne({
      where: { tipo: TipoTarifa.CUOTA },
      order: { vigente_desde: 'DESC' },
    });

    if (!tarifaCuota) {
      console.error('No se encontró tarifa de cuota vigente para generar cuotas mensuales');
      return;
    }

    // Obtener todos los socios activos
    const sociosActivos = await this.usuarioRepository.find({
      where: { rol: Rol.SOCIO, activo: true },
    });

    for (const socio of sociosActivos) {
      // Verificar si ya existe una cuota para este socio en este mes/año
      const cuotaExistente = await this.cuotaRepository.findOne({
        where: {
          socio_id: socio.id,
          mes,
          anio,
        },
      });

      if (!cuotaExistente) {
        const nuevaCuota = this.cuotaRepository.create({
          socio_id: socio.id,
          mes,
          anio,
          monto_total: tarifaCuota.valor,
          monto_abonado: 0,
          estado: EstadoCuota.PENDIENTE,
        });

        await this.cuotaRepository.save(nuevaCuota);
      }
    }

    console.log(`Cuotas generadas para ${sociosActivos.length} socios activos - ${mes}/${anio}`);
  }

  async findAll(filtros: CuotaFiltros, userId?: string, userRole?: Rol): Promise<any[]> {
    const queryBuilder = this.cuotaRepository
      .createQueryBuilder('cuota')
      .leftJoinAndSelect('cuota.socio', 'socio')
      .orderBy('cuota.created_at', 'DESC');

    // Si no es admin, solo mostrar cuotas propias
    if (userRole !== Rol.ADMINISTRADOR && userId) {
      queryBuilder.andWhere('cuota.socio_id = :userId', { userId });
    }

    // Aplicar filtros
    if (filtros.nombre) {
      queryBuilder.andWhere('socio.nombre LIKE :nombre', {
        nombre: `%${filtros.nombre}%`,
      });
    }

    if (filtros.apellido) {
      queryBuilder.andWhere('socio.apellido LIKE :apellido', {
        apellido: `%${filtros.apellido}%`,
      });
    }

    if (filtros.estado) {
      queryBuilder.andWhere('cuota.estado = :estado', { estado: filtros.estado });
    }

    if (filtros.fechaDesde && filtros.fechaHasta) {
      queryBuilder.andWhere('cuota.created_at BETWEEN :fechaDesde AND :fechaHasta', {
        fechaDesde: new Date(filtros.fechaDesde),
        fechaHasta: new Date(filtros.fechaHasta),
      });
    } else if (filtros.fechaDesde) {
      queryBuilder.andWhere('cuota.created_at >= :fechaDesde', {
        fechaDesde: new Date(filtros.fechaDesde),
      });
    } else if (filtros.fechaHasta) {
      queryBuilder.andWhere('cuota.created_at <= :fechaHasta', {
        fechaHasta: new Date(filtros.fechaHasta),
      });
    }

    const cuotas = await queryBuilder.getMany();

    // Formatear respuesta con campos requeridos
    return cuotas.map((cuota) => ({
      id: cuota.id,
      socio: {
        nombre: cuota.socio.nombre,
        apellido: cuota.socio.apellido,
      },
      mes: cuota.mes,
      anio: cuota.anio,
      monto_total: Number(cuota.monto_total),
      monto_abonado: Number(cuota.monto_abonado),
      saldo_pendiente: Number(cuota.monto_total) - Number(cuota.monto_abonado),
      estado: cuota.estado,
      created_at: cuota.created_at,
    }));
  }

  async registrarPago(
    cuotaId: string,
    dto: CreatePagoCuotaDto,
    registradoPor: string,
  ): Promise<{ message: string; cuota: any }> {
    const cuota = await this.cuotaRepository.findOne({
      where: { id: cuotaId },
      relations: ['socio'],
    });

    if (!cuota) {
      throw new NotFoundException({
        error: {
          code: 'CUOTA_NO_ENCONTRADA',
          message: 'Cuota no encontrada.',
        },
      });
    }

    // Verificar que el monto no exceda el saldo pendiente
    const saldoPendiente = Number(cuota.monto_total) - Number(cuota.monto_abonado);
    if (dto.monto > saldoPendiente) {
      throw new BadRequestException({
        error: {
          code: 'MONTO_EXCEDE_SALDO',
          message: 'El monto del pago excede el saldo pendiente de la cuota.',
        },
      });
    }

    // Crear el pago
    const pago = this.pagoCuotaRepository.create({
      cuota_id: cuotaId,
      monto: dto.monto,
      fecha_pago: new Date(),
      registrado_por: registradoPor,
    });

    await this.pagoCuotaRepository.save(pago);

    // Actualizar monto abonado y estado de la cuota
    cuota.monto_abonado = Number(cuota.monto_abonado) + dto.monto;

    // Determinar nuevo estado
    if (cuota.monto_abonado >= Number(cuota.monto_total)) {
      cuota.estado = EstadoCuota.PAGADA;
    } else if (cuota.monto_abonado > 0) {
      cuota.estado = EstadoCuota.PARCIAL;
    } else {
      cuota.estado = EstadoCuota.PENDIENTE;
    }

    await this.cuotaRepository.save(cuota);

    return {
      message: 'Pago registrado exitosamente',
      cuota: {
        id: cuota.id,
        socio: {
          nombre: cuota.socio.nombre,
          apellido: cuota.socio.apellido,
        },
        mes: cuota.mes,
        anio: cuota.anio,
        monto_total: Number(cuota.monto_total),
        monto_abonado: Number(cuota.monto_abonado),
        saldo_pendiente: Number(cuota.monto_total) - Number(cuota.monto_abonado),
        estado: cuota.estado,
      },
    };
  }

  // Método para generar cuotas manualmente (usado por el admin)
  async generarCuotasManuales(monto: number): Promise<{ message: string; cuotasGeneradas: number }> {
    const now = new Date();
    const mes = now.getMonth() + 1; // getMonth() returns 0-11
    const anio = now.getFullYear();

    // Obtener todos los socios activos
    const sociosActivos = await this.usuarioRepository.find({
      where: { rol: Rol.SOCIO, activo: true },
    });

    let cuotasGeneradas = 0;

    for (const socio of sociosActivos) {
      // Verificar si ya existe una cuota para este socio en este mes/año
      const cuotaExistente = await this.cuotaRepository.findOne({
        where: {
          socio_id: socio.id,
          mes,
          anio,
        },
      });

      if (!cuotaExistente) {
        const nuevaCuota = this.cuotaRepository.create({
          socio_id: socio.id,
          mes,
          anio,
          monto_total: monto,
          monto_abonado: 0,
          estado: EstadoCuota.PENDIENTE,
        });

        await this.cuotaRepository.save(nuevaCuota);
        cuotasGeneradas++;
      }
    }

    return {
      message: `Cuotas generadas exitosamente para ${cuotasGeneradas} socios activos`,
      cuotasGeneradas,
    };
  }

  // Método para obtener cuotas impagas de un socio (usado por turnos service)
  async getCuotasImpagas(socioId: string): Promise<number> {
    const count = await this.cuotaRepository.count({
      where: {
        socio_id: socioId,
        estado: EstadoCuota.PENDIENTE,
      },
    });

    return count;
  }

  // Método para obtener pagos de una cuota
  async getPagos(cuotaId: string, userId: string, userRole: Rol): Promise<any[]> {
    const cuota = await this.cuotaRepository.findOne({
      where: { id: cuotaId },
    });

    if (!cuota) {
      throw new NotFoundException({
        error: {
          code: 'CUOTA_NO_ENCONTRADA',
          message: 'Cuota no encontrada.',
        },
      });
    }

    // Si no es admin, verificar que la cuota pertenezca al usuario
    if (userRole !== Rol.ADMINISTRADOR && cuota.socio_id !== userId) {
      throw new NotFoundException({
        error: {
          code: 'CUOTA_NO_ENCONTRADA',
          message: 'Cuota no encontrada.',
        },
      });
    }

    const pagos = await this.pagoCuotaRepository.find({
      where: { cuota_id: cuotaId },
      order: { fecha_pago: 'DESC' },
    });

    return pagos.map((pago) => ({
      id: pago.id,
      monto: Number(pago.monto),
      fecha_pago: pago.fecha_pago,
    }));
  }
}