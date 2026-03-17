import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Usuario } from '../entities/usuario.entity';
import { Turno } from '../entities/turno.entity';
import { Cuota } from '../entities/cuota.entity';
import { PagoCuota } from '../entities/pago-cuota.entity';
import { PagoLuz } from '../entities/pago-luz.entity';
import { PagoTurno } from '../entities/pago-turno.entity';
import { Cancha } from '../entities/cancha.entity';
import { FiltroEstadisticasDto } from './dto/filtro-estadisticas.dto';
import { Rol } from '../common/enums/rol.enum';
import { EstadoTurno } from '../common/enums/estado-turno.enum';

@Injectable()
export class EstadisticasService {
  constructor(
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
    @InjectRepository(Turno)
    private turnoRepository: Repository<Turno>,
    @InjectRepository(Cuota)
    private cuotaRepository: Repository<Cuota>,
    @InjectRepository(PagoCuota)
    private pagoCuotaRepository: Repository<PagoCuota>,
    @InjectRepository(PagoLuz)
    private pagoLuzRepository: Repository<PagoLuz>,
    @InjectRepository(PagoTurno)
    private pagoTurnoRepository: Repository<PagoTurno>,
    @InjectRepository(Cancha)
    private canchaRepository: Repository<Cancha>,
  ) {}

  async getEstadisticasGenerales(filtros: FiltroEstadisticasDto) {
    // Total socios activos
    const totalSociosActivos = await this.usuarioRepository.count({
      where: {
        rol: Rol.SOCIO,
        activo: true,
      },
    });

    // Preparar filtros de fecha para turnos
    const whereConditions: any = {
      estado: EstadoTurno.ACTIVO,
    };

    if (filtros.fechaInicio && filtros.fechaFin) {
      whereConditions.fecha_inicio = Between(
        new Date(filtros.fechaInicio),
        new Date(filtros.fechaFin),
      );
    } else if (filtros.fechaInicio) {
      whereConditions.fecha_inicio = Between(
        new Date(filtros.fechaInicio),
        new Date(),
      );
    } else if (filtros.fechaFin) {
      whereConditions.fecha_inicio = Between(
        new Date('1900-01-01'),
        new Date(filtros.fechaFin),
      );
    }

    // Total turnos en período
    const totalTurnos = await this.turnoRepository.count({
      where: whereConditions,
    });

    // Canchas más utilizadas
    const canchasMasUtilizadasRaw = await this.turnoRepository
      .createQueryBuilder('turno')
      .select('cancha.numero', 'numero')
      .addSelect('COUNT(turno.id)', 'cantidad')
      .innerJoin('turno.cancha', 'cancha')
      .where('turno.estado = :estado', { estado: EstadoTurno.ACTIVO })
      .andWhere(
        filtros.fechaInicio && filtros.fechaFin
          ? 'turno.fecha_inicio BETWEEN :fechaInicio AND :fechaFin'
          : filtros.fechaInicio
          ? 'turno.fecha_inicio >= :fechaInicio'
          : filtros.fechaFin
          ? 'turno.fecha_inicio <= :fechaFin'
          : '1=1',
        {
          fechaInicio: filtros.fechaInicio,
          fechaFin: filtros.fechaFin,
        },
      )
      .groupBy('cancha.numero')
      .orderBy('COUNT(turno.id)', 'DESC')
      .getRawMany();

    // Sort in application layer for consistent ordering
    const canchasMasUtilizadas = canchasMasUtilizadasRaw.sort((a, b) => {
      if (b.cantidad !== a.cantidad) {
        return b.cantidad - a.cantidad;
      }
      return a.numero - b.numero;
    });

    // Horas pico (agrupado por hora del día)
    const horasPicoRaw = await this.turnoRepository
      .createQueryBuilder('turno')
      .select('EXTRACT(HOUR FROM turno.fecha_inicio)', 'hora')
      .addSelect('COUNT(turno.id)', 'cantidad')
      .where('turno.estado = :estado', { estado: EstadoTurno.ACTIVO })
      .andWhere(
        filtros.fechaInicio && filtros.fechaFin
          ? 'turno.fecha_inicio BETWEEN :fechaInicio AND :fechaFin'
          : filtros.fechaInicio
          ? 'turno.fecha_inicio >= :fechaInicio'
          : filtros.fechaFin
          ? 'turno.fecha_inicio <= :fechaFin'
          : '1=1',
        {
          fechaInicio: filtros.fechaInicio,
          fechaFin: filtros.fechaFin,
        },
      )
      .groupBy('EXTRACT(HOUR FROM turno.fecha_inicio)')
      .orderBy('COUNT(turno.id)', 'DESC')
      .getRawMany();

    // Sort in application layer for consistent ordering
    const horasPico = horasPicoRaw.sort((a, b) => {
      if (b.cantidad !== a.cantidad) {
        return b.cantidad - a.cantidad;
      }
      return a.hora - b.hora;
    });

    return {
      totalSociosActivos,
      totalTurnos,
      canchasMasUtilizadas,
      horasPico,
    };
  }

  async getEstadisticasFinancieras(filtros: FiltroEstadisticasDto) {
    // Preparar filtros de fecha
    const whereConditionsPagos: any = {};
    const whereConditionsTurnos: any = {};

    if (filtros.fechaInicio && filtros.fechaFin) {
      whereConditionsPagos.fecha_pago = Between(
        new Date(filtros.fechaInicio),
        new Date(filtros.fechaFin),
      );
      whereConditionsTurnos.fecha_inicio = Between(
        new Date(filtros.fechaInicio),
        new Date(filtros.fechaFin),
      );
    } else if (filtros.fechaInicio) {
      whereConditionsPagos.fecha_pago = Between(
        new Date(filtros.fechaInicio),
        new Date(),
      );
      whereConditionsTurnos.fecha_inicio = Between(
        new Date(filtros.fechaInicio),
        new Date(),
      );
    } else if (filtros.fechaFin) {
      whereConditionsPagos.fecha_pago = Between(
        new Date('1900-01-01'),
        new Date(filtros.fechaFin),
      );
      whereConditionsTurnos.fecha_inicio = Between(
        new Date('1900-01-01'),
        new Date(filtros.fechaFin),
      );
    }

    // Recaudación por cuotas (suma de pagos de cuotas)
    const recaudacionCuotas = await this.pagoCuotaRepository
      .createQueryBuilder('pago')
      .select('SUM(pago.monto)', 'total')
      .where(
        Object.keys(whereConditionsPagos).length > 0
          ? 'pago.fecha_pago BETWEEN :fechaInicio AND :fechaFin'
          : '1=1',
        {
          fechaInicio: filtros.fechaInicio || '1900-01-01',
          fechaFin: filtros.fechaFin || new Date().toISOString(),
        },
      )
      .getRawOne();

    // Recaudación por turnos No_Socio (suma de pagos de turnos)
    const recaudacionTurnosNoSocio = await this.pagoTurnoRepository
      .createQueryBuilder('pago')
      .select('SUM(pago.monto)', 'total')
      .where(
        Object.keys(whereConditionsPagos).length > 0
          ? 'pago.fecha_pago BETWEEN :fechaInicio AND :fechaFin'
          : '1=1',
        {
          fechaInicio: filtros.fechaInicio || '1900-01-01',
          fechaFin: filtros.fechaFin || new Date().toISOString(),
        },
      )
      .getRawOne();

    // Cargos de luz (suma de costos de luz de turnos en el período)
    const cargosLuz = await this.turnoRepository
      .createQueryBuilder('turno')
      .select('SUM(turno.costo_luz)', 'total')
      .where('turno.requiere_luz = :requiereLuz', { requiereLuz: true })
      .andWhere('turno.estado = :estado', { estado: EstadoTurno.ACTIVO })
      .andWhere(
        Object.keys(whereConditionsTurnos).length > 0
          ? 'turno.fecha_inicio BETWEEN :fechaInicio AND :fechaFin'
          : '1=1',
        {
          fechaInicio: filtros.fechaInicio || '1900-01-01',
          fechaFin: filtros.fechaFin || new Date().toISOString(),
        },
      )
      .getRawOne();

    // Pagos de luz (suma de pagos de luz registrados)
    const pagosLuz = await this.pagoLuzRepository
      .createQueryBuilder('pago')
      .select('SUM(pago.monto)', 'total')
      .where(
        Object.keys(whereConditionsPagos).length > 0
          ? 'pago.fecha_pago BETWEEN :fechaInicio AND :fechaFin'
          : '1=1',
        {
          fechaInicio: filtros.fechaInicio || '1900-01-01',
          fechaFin: filtros.fechaFin || new Date().toISOString(),
        },
      )
      .getRawOne();

    return {
      recaudacionCuotas: parseFloat(recaudacionCuotas?.total || '0'),
      recaudacionTurnosNoSocio: parseFloat(recaudacionTurnosNoSocio?.total || '0'),
      cargosLuz: parseFloat(cargosLuz?.total || '0'),
      pagosLuz: parseFloat(pagosLuz?.total || '0'),
    };
  }
}