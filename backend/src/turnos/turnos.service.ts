import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan, SelectQueryBuilder } from 'typeorm';
import { Turno } from '../entities/turno.entity';
import { Cancha } from '../entities/cancha.entity';
import { Cuota } from '../entities/cuota.entity';
import { PagoTurno } from '../entities/pago-turno.entity';
import { ConfiguracionService } from '../configuracion/configuracion.service';
import { TarifasService } from '../tarifas/tarifas.service';
import { CanchasService } from '../canchas/canchas.service';
import { CreateTurnoDto } from './dto/create-turno.dto';
import { EstadoCancha } from '../common/enums/estado-cancha.enum';
import { EstadoCuota } from '../common/enums/estado-cuota.enum';
import { EstadoTurno } from '../common/enums/estado-turno.enum';
import { TipoTarifa } from '../common/enums/tipo-tarifa.enum';
import { Rol } from '../common/enums/rol.enum';

@Injectable()
export class TurnosService {
  constructor(
    @InjectRepository(Turno)
    private readonly turnoRepository: Repository<Turno>,
    @InjectRepository(Cancha)
    private readonly canchaRepository: Repository<Cancha>,
    @InjectRepository(Cuota)
    private readonly cuotaRepository: Repository<Cuota>,
    @InjectRepository(PagoTurno)
    private readonly pagoTurnoRepository: Repository<PagoTurno>,
    private readonly configuracionService: ConfiguracionService,
    private readonly tarifasService: TarifasService,
  ) {}

  async create(dto: CreateTurnoDto, userId: string, userRole: Rol): Promise<any> {
    const fechaInicio = new Date(dto.fecha_hora_inicio);

    // 1. Validar que la cancha existe y está disponible
    const cancha = await this.canchaRepository.findOne({
      where: { id: dto.cancha_id },
    });

    if (!cancha) {
      throw new NotFoundException({
        error: {
          code: 'CANCHA_NO_ENCONTRADA',
          message: 'Cancha no encontrada.',
        },
      });
    }

    if (cancha.estado !== EstadoCancha.DISPONIBLE) {
      throw new BadRequestException({
        error: {
          code: 'CANCHA_NO_DISPONIBLE',
          message: 'La cancha no está disponible.',
        },
      });
    }

    // 2. Obtener configuración del club
    const config = await this.configuracionService.getConfiguracion();

    // 3. Calcular duración según día de la semana
    const diaSemana = fechaInicio.getDay(); // 0=domingo, 6=sábado
    const esFinde = diaSemana === 0 || diaSemana === 6;
    const duracionMinutos = esFinde
      ? config.duracion_finde_min
      : config.duracion_semana_min;

    const fechaFin = new Date(fechaInicio.getTime() + duracionMinutos * 60000);

    // 4. Validar horario de funcionamiento
    const horaInicio = this.getTimeString(fechaInicio);
    const horaFin = this.getTimeString(fechaFin);

    if (horaInicio < config.apertura || horaFin > config.cierre) {
      throw new BadRequestException({
        error: {
          code: 'FUERA_DE_HORARIO',
          message: 'El turno está fuera del horario de funcionamiento del club.',
        },
      });
    }

    // 5. Validar conflicto de horario
    const conflicto = await this.turnoRepository.findOne({
      where: {
        cancha_id: dto.cancha_id,
        estado: EstadoTurno.ACTIVO,
      },
    });

    if (conflicto) {
      // Check for overlap
      const conflictoInicio = new Date(conflicto.fecha_inicio);
      const conflictoFin = new Date(conflicto.fecha_fin);

      const hayOverlap =
        (fechaInicio >= conflictoInicio && fechaInicio < conflictoFin) ||
        (fechaFin > conflictoInicio && fechaFin <= conflictoFin) ||
        (fechaInicio <= conflictoInicio && fechaFin >= conflictoFin);

      if (hayOverlap) {
        throw new BadRequestException({
          error: {
            code: 'CONFLICTO_HORARIO',
            message: 'Ya existe un turno reservado en ese horario.',
          },
        });
      }
    }

    // 6. Validar anticipación máxima (solo para no-admin)
    if (userRole !== Rol.ADMINISTRADOR) {
      const ahora = new Date();
      const unDiaEnMs = 24 * 60 * 60 * 1000;
      const diferencia = fechaInicio.getTime() - ahora.getTime();

      if (diferencia > unDiaEnMs) {
        throw new BadRequestException({
          error: {
            code: 'ANTICIPACION_MAXIMA',
            message: 'Solo se puede reservar con hasta 1 día de anticipación.',
          },
        });
      }
    }

    // 7. Validar límite diario (solo para no-admin)
    if (userRole !== Rol.ADMINISTRADOR) {
      const inicioDia = new Date(fechaInicio);
      inicioDia.setHours(0, 0, 0, 0);
      const finDia = new Date(fechaInicio);
      finDia.setHours(23, 59, 59, 999);

      const turnosDelDia = await this.turnoRepository.count({
        where: {
          usuario_id: userId,
          estado: EstadoTurno.ACTIVO,
        },
      });

      // Filter by date range manually since TypeScript doesn't support Between for dates easily
      const turnosDelDiaFiltrados = await this.turnoRepository
        .createQueryBuilder('turno')
        .where('turno.usuario_id = :userId', { userId })
        .andWhere('turno.estado = :estado', { estado: EstadoTurno.ACTIVO })
        .andWhere('turno.fecha_inicio >= :inicioDia', { inicioDia })
        .andWhere('turno.fecha_inicio <= :finDia', { finDia })
        .getCount();

      if (turnosDelDiaFiltrados >= 2) {
        throw new BadRequestException({
          error: {
            code: 'LIMITE_DIARIO',
            message: 'Ya alcanzó el límite de 2 turnos por día.',
          },
        });
      }
    }

    // 8. Validar bloqueo por deuda (solo para no-admin)
    if (userRole !== Rol.ADMINISTRADOR) {
      const cuotasPendientes = await this.cuotaRepository.count({
        where: {
          socio_id: userId,
          estado: EstadoCuota.PENDIENTE,
        },
      });

      if (cuotasPendientes >= 2) {
        throw new ForbiddenException({
          error: {
            code: 'BLOQUEADO_POR_DEUDA',
            message: 'No puede reservar turnos con 2 o más cuotas impagas.',
          },
        });
      }
    }

    // 9. Obtener tarifa vigente para TURNO_NO_SOCIO
    const tarifas = await this.tarifasService.findVigentes();
    const tarifaTurno = tarifas.find((t) => t.tipo === TipoTarifa.TURNO_NO_SOCIO);

    if (!tarifaTurno) {
      throw new BadRequestException({
        error: {
          code: 'TARIFA_NO_ENCONTRADA',
          message: 'No se encontró la tarifa vigente para turnos.',
        },
      });
    }

    const costoTurno = Number(tarifaTurno.valor);

    // 10. Calcular cargo de luz
    let requiereLuz = false;
    let costoLuz = 0;

    const overlapsLuz = this.overlapsTimeRange(
      horaInicio,
      horaFin,
      config.luz_inicio,
      config.luz_fin,
    );

    if (overlapsLuz) {
      requiereLuz = true;
      const tarifaLuz = tarifas.find((t) => t.tipo === TipoTarifa.LUZ);
      if (tarifaLuz) {
        costoLuz = Number(tarifaLuz.valor);
      }
    }

    // 11. Crear el turno
    const turno = this.turnoRepository.create({
      usuario_id: userId,
      cancha_id: dto.cancha_id,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      requiere_luz: requiereLuz,
      costo_turno: costoTurno,
      costo_luz: costoLuz,
      estado: EstadoTurno.ACTIVO,
    });

    const saved = await this.turnoRepository.save(turno);

    // 12. Return response with calculated fields
    return {
      id: saved.id,
      usuario_id: saved.usuario_id,
      cancha_id: saved.cancha_id,
      fecha_hora_inicio: saved.fecha_inicio,
      fecha_hora_fin: saved.fecha_fin,
      duracion_minutos: duracionMinutos,
      requiere_luz: saved.requiere_luz,
      costo_turno: saved.costo_turno,
      cargo_luz: saved.costo_luz,
      estado: saved.estado,
      created_at: saved.created_at,
    };
  }

  async cancelTurno(turnoId: string, userId: string, userRole: Rol): Promise<any> {
    // 1. Buscar el turno
    const turno = await this.turnoRepository.findOne({
      where: { id: turnoId },
      relations: ['usuario'],
    });

    if (!turno) {
      throw new NotFoundException({
        error: {
          code: 'TURNO_NO_ENCONTRADO',
          message: 'Turno no encontrado.',
        },
      });
    }

    // 2. Verificar que no esté ya cancelado
    if (turno.estado === EstadoTurno.CANCELADO) {
      throw new BadRequestException({
        error: {
          code: 'TURNO_YA_CANCELADO',
          message: 'El turno ya está cancelado.',
        },
      });
    }

    // 3. Verificar permisos (solo el dueño o admin puede cancelar)
    if (userRole !== Rol.ADMINISTRADOR && turno.usuario_id !== userId) {
      throw new ForbiddenException({
        error: {
          code: 'SIN_PERMISOS',
          message: 'No tiene permisos para cancelar este turno.',
        },
      });
    }

    // 4. Validar anticipación mínima de 1 hora
    const ahora = new Date();
    const fechaInicio = new Date(turno.fecha_inicio);
    const unaHoraEnMs = 60 * 60 * 1000;
    const diferencia = fechaInicio.getTime() - ahora.getTime();

    if (diferencia < unaHoraEnMs) {
      throw new BadRequestException({
        error: {
          code: 'ANTICIPACION_INSUFICIENTE',
          message: 'Debe cancelar con al menos 1 hora de anticipación.',
        },
      });
    }

    // 5. Actualizar el turno
    turno.estado = EstadoTurno.CANCELADO;
    turno.cancelado_en = new Date();
    turno.cancelado_por = userId;

    const turnoActualizado = await this.turnoRepository.save(turno);

    // 6. Retornar respuesta con detalles de la cancelación
    return {
      message: 'Turno cancelado exitosamente',
      turno: {
        id: turnoActualizado.id,
        estado: turnoActualizado.estado,
        cancelado_en: turnoActualizado.cancelado_en,
        cancelado_por: turnoActualizado.cancelado_por,
        fecha_hora_inicio: turnoActualizado.fecha_inicio,
        cancha_id: turnoActualizado.cancha_id,
      },
    };
  }

  async findTurnos(
    userId: string,
    userRole: Rol,
    filters: {
      nombre?: string;
      apellido?: string;
      fechaDesde?: string;
      fechaHasta?: string;
    }
  ): Promise<any[]> {
    const query = this.turnoRepository
      .createQueryBuilder('turno')
      .leftJoinAndSelect('turno.usuario', 'usuario')
      .leftJoinAndSelect('turno.cancha', 'cancha')
      .leftJoinAndSelect('turno.pago_turno', 'pago_turno')
      .where('turno.estado = :estado', { estado: EstadoTurno.ACTIVO });

    // Apply access control
    if (userRole !== Rol.ADMINISTRADOR) {
      query.andWhere('turno.usuario_id = :userId', { userId });
    }

    // Apply filters (only for admin)
    if (userRole === Rol.ADMINISTRADOR) {
      if (filters.nombre) {
        query.andWhere('usuario.nombre LIKE :nombre', { 
          nombre: `%${filters.nombre}%` 
        });
      }
      
      if (filters.apellido) {
        query.andWhere('usuario.apellido LIKE :apellido', { 
          apellido: `%${filters.apellido}%` 
        });
      }
      
      if (filters.fechaDesde) {
        const fechaDesde = new Date(filters.fechaDesde);
        query.andWhere('turno.fecha_inicio >= :fechaDesde', { fechaDesde });
      }
      
      if (filters.fechaHasta) {
        const fechaHasta = new Date(filters.fechaHasta);
        fechaHasta.setHours(23, 59, 59, 999); // End of day
        query.andWhere('turno.fecha_inicio <= :fechaHasta', { fechaHasta });
      }
    }

    query.orderBy('turno.fecha_inicio', 'ASC');

    const turnos = await query.getMany();

    return turnos.map(turno => this.formatTurnoResponse(turno, userRole));
  }

  async findHistorial(
    userId: string,
    userRole: Rol,
    filters: {
      nombre?: string;
      apellido?: string;
      fechaDesde?: string;
      fechaHasta?: string;
    }
  ): Promise<any[]> {
    const query = this.turnoRepository
      .createQueryBuilder('turno')
      .leftJoinAndSelect('turno.usuario', 'usuario')
      .leftJoinAndSelect('turno.cancha', 'cancha');

    // Apply access control
    if (userRole !== Rol.ADMINISTRADOR) {
      query.where('turno.usuario_id = :userId', { userId });
    }

    // Apply filters (only for admin)
    if (userRole === Rol.ADMINISTRADOR) {
      if (filters.nombre) {
        query.andWhere('usuario.nombre LIKE :nombre', { 
          nombre: `%${filters.nombre}%` 
        });
      }
      
      if (filters.apellido) {
        query.andWhere('usuario.apellido LIKE :apellido', { 
          apellido: `%${filters.apellido}%` 
        });
      }
      
      if (filters.fechaDesde) {
        const fechaDesde = new Date(filters.fechaDesde);
        query.andWhere('turno.fecha_inicio >= :fechaDesde', { fechaDesde });
      }
      
      if (filters.fechaHasta) {
        const fechaHasta = new Date(filters.fechaHasta);
        fechaHasta.setHours(23, 59, 59, 999); // End of day
        query.andWhere('turno.fecha_inicio <= :fechaHasta', { fechaHasta });
      }
    }

    query.orderBy('turno.fecha_inicio', 'DESC');

    const turnos = await query.getMany();

    return turnos.map(turno => this.formatTurnoResponse(turno, userRole));
  }

  private formatTurnoResponse(turno: Turno, userRole: Rol): any {
    const baseResponse = {
      id: turno.id,
      fecha_inicio: turno.fecha_inicio,
      fecha_fin: turno.fecha_fin,
      estado: turno.estado,
      requiere_luz: turno.requiere_luz,
      costo_turno: turno.costo_turno,
      costo_luz: turno.costo_luz,
      created_at: turno.created_at,
      cancha: {
        id: turno.cancha.id,
        numero: turno.cancha.numero,
        estado: turno.cancha.estado,
      },
    };

    // Include user info for admin
    if (userRole === Rol.ADMINISTRADOR && turno.usuario) {
      return {
        ...baseResponse,
        usuario: {
          id: turno.usuario.id,
          nombre: turno.usuario.nombre,
          apellido: turno.usuario.apellido,
          email: turno.usuario.email,
          rol: turno.usuario.rol,
        },
        // Include payment status for No_Socio turnos
        pago_turno: turno.usuario.rol === Rol.NO_SOCIO ? {
          pagado: !!turno.pago_turno,
          fecha_pago: turno.pago_turno?.fecha_pago || null,
          monto: turno.pago_turno?.monto || null,
          metodo_pago: turno.pago_turno?.metodo_pago || null,
        } : null,
      };
    }

    // For non-admin users, exclude other users' data
    return baseResponse;
  }

  private getTimeString(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }

  private overlapsTimeRange(
    start: string,
    end: string,
    rangeStart: string,
    rangeEnd: string,
  ): boolean {
    return (
      (start >= rangeStart && start < rangeEnd) ||
      (end > rangeStart && end <= rangeEnd) ||
      (start <= rangeStart && end >= rangeEnd)
    );
  }
}
