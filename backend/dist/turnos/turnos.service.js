"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TurnosService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const turno_entity_1 = require("../entities/turno.entity");
const cancha_entity_1 = require("../entities/cancha.entity");
const cuota_entity_1 = require("../entities/cuota.entity");
const pago_turno_entity_1 = require("../entities/pago-turno.entity");
const configuracion_service_1 = require("../configuracion/configuracion.service");
const tarifas_service_1 = require("../tarifas/tarifas.service");
const estado_cancha_enum_1 = require("../common/enums/estado-cancha.enum");
const estado_cuota_enum_1 = require("../common/enums/estado-cuota.enum");
const estado_turno_enum_1 = require("../common/enums/estado-turno.enum");
const tipo_tarifa_enum_1 = require("../common/enums/tipo-tarifa.enum");
const rol_enum_1 = require("../common/enums/rol.enum");
let TurnosService = class TurnosService {
    constructor(turnoRepository, canchaRepository, cuotaRepository, pagoTurnoRepository, configuracionService, tarifasService) {
        this.turnoRepository = turnoRepository;
        this.canchaRepository = canchaRepository;
        this.cuotaRepository = cuotaRepository;
        this.pagoTurnoRepository = pagoTurnoRepository;
        this.configuracionService = configuracionService;
        this.tarifasService = tarifasService;
    }
    async create(dto, userId, userRole) {
        const fechaInicio = new Date(dto.fecha_hora_inicio);
        const cancha = await this.canchaRepository.findOne({
            where: { id: dto.cancha_id },
        });
        if (!cancha) {
            throw new common_1.NotFoundException({
                error: {
                    code: 'CANCHA_NO_ENCONTRADA',
                    message: 'Cancha no encontrada.',
                },
            });
        }
        if (cancha.estado !== estado_cancha_enum_1.EstadoCancha.DISPONIBLE) {
            throw new common_1.BadRequestException({
                error: {
                    code: 'CANCHA_NO_DISPONIBLE',
                    message: 'La cancha no está disponible.',
                },
            });
        }
        const config = await this.configuracionService.getConfiguracion();
        const diaSemana = fechaInicio.getDay();
        const esFinde = diaSemana === 0 || diaSemana === 6;
        const duracionMinutos = esFinde
            ? config.duracion_finde_min
            : config.duracion_semana_min;
        const fechaFin = new Date(fechaInicio.getTime() + duracionMinutos * 60000);
        const horaInicio = this.getTimeString(fechaInicio);
        const horaFin = this.getTimeString(fechaFin);
        if (horaInicio < config.apertura || horaFin > config.cierre) {
            throw new common_1.BadRequestException({
                error: {
                    code: 'FUERA_DE_HORARIO',
                    message: 'El turno está fuera del horario de funcionamiento del club.',
                },
            });
        }
        const conflicto = await this.turnoRepository.findOne({
            where: {
                cancha_id: dto.cancha_id,
                estado: estado_turno_enum_1.EstadoTurno.ACTIVO,
            },
        });
        if (conflicto) {
            const conflictoInicio = new Date(conflicto.fecha_inicio);
            const conflictoFin = new Date(conflicto.fecha_fin);
            const hayOverlap = (fechaInicio >= conflictoInicio && fechaInicio < conflictoFin) ||
                (fechaFin > conflictoInicio && fechaFin <= conflictoFin) ||
                (fechaInicio <= conflictoInicio && fechaFin >= conflictoFin);
            if (hayOverlap) {
                throw new common_1.BadRequestException({
                    error: {
                        code: 'CONFLICTO_HORARIO',
                        message: 'Ya existe un turno reservado en ese horario.',
                    },
                });
            }
        }
        if (userRole !== rol_enum_1.Rol.ADMINISTRADOR) {
            const ahora = new Date();
            const unDiaEnMs = 24 * 60 * 60 * 1000;
            const diferencia = fechaInicio.getTime() - ahora.getTime();
            if (diferencia > unDiaEnMs) {
                throw new common_1.BadRequestException({
                    error: {
                        code: 'ANTICIPACION_MAXIMA',
                        message: 'Solo se puede reservar con hasta 1 día de anticipación.',
                    },
                });
            }
        }
        if (userRole !== rol_enum_1.Rol.ADMINISTRADOR) {
            const inicioDia = new Date(fechaInicio);
            inicioDia.setHours(0, 0, 0, 0);
            const finDia = new Date(fechaInicio);
            finDia.setHours(23, 59, 59, 999);
            const turnosDelDia = await this.turnoRepository.count({
                where: {
                    usuario_id: userId,
                    estado: estado_turno_enum_1.EstadoTurno.ACTIVO,
                },
            });
            const turnosDelDiaFiltrados = await this.turnoRepository
                .createQueryBuilder('turno')
                .where('turno.usuario_id = :userId', { userId })
                .andWhere('turno.estado = :estado', { estado: estado_turno_enum_1.EstadoTurno.ACTIVO })
                .andWhere('turno.fecha_inicio >= :inicioDia', { inicioDia })
                .andWhere('turno.fecha_inicio <= :finDia', { finDia })
                .getCount();
            if (turnosDelDiaFiltrados >= 2) {
                throw new common_1.BadRequestException({
                    error: {
                        code: 'LIMITE_DIARIO',
                        message: 'Ya alcanzó el límite de 2 turnos por día.',
                    },
                });
            }
        }
        if (userRole !== rol_enum_1.Rol.ADMINISTRADOR) {
            const cuotasPendientes = await this.cuotaRepository.count({
                where: {
                    socio_id: userId,
                    estado: estado_cuota_enum_1.EstadoCuota.PENDIENTE,
                },
            });
            if (cuotasPendientes >= 2) {
                throw new common_1.ForbiddenException({
                    error: {
                        code: 'BLOQUEADO_POR_DEUDA',
                        message: 'No puede reservar turnos con 2 o más cuotas impagas.',
                    },
                });
            }
        }
        const tarifas = await this.tarifasService.findVigentes();
        const tarifaTurno = tarifas.find((t) => t.tipo === tipo_tarifa_enum_1.TipoTarifa.TURNO_NO_SOCIO);
        if (!tarifaTurno) {
            throw new common_1.BadRequestException({
                error: {
                    code: 'TARIFA_NO_ENCONTRADA',
                    message: 'No se encontró la tarifa vigente para turnos.',
                },
            });
        }
        const costoTurno = Number(tarifaTurno.valor);
        let requiereLuz = false;
        let costoLuz = 0;
        const overlapsLuz = this.overlapsTimeRange(horaInicio, horaFin, config.luz_inicio, config.luz_fin);
        if (overlapsLuz) {
            requiereLuz = true;
            const tarifaLuz = tarifas.find((t) => t.tipo === tipo_tarifa_enum_1.TipoTarifa.LUZ);
            if (tarifaLuz) {
                costoLuz = Number(tarifaLuz.valor);
            }
        }
        const turno = this.turnoRepository.create({
            usuario_id: userId,
            cancha_id: dto.cancha_id,
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin,
            requiere_luz: requiereLuz,
            costo_turno: costoTurno,
            costo_luz: costoLuz,
            estado: estado_turno_enum_1.EstadoTurno.ACTIVO,
        });
        const saved = await this.turnoRepository.save(turno);
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
    async cancelTurno(turnoId, userId, userRole) {
        const turno = await this.turnoRepository.findOne({
            where: { id: turnoId },
            relations: ['usuario'],
        });
        if (!turno) {
            throw new common_1.NotFoundException({
                error: {
                    code: 'TURNO_NO_ENCONTRADO',
                    message: 'Turno no encontrado.',
                },
            });
        }
        if (turno.estado === estado_turno_enum_1.EstadoTurno.CANCELADO) {
            throw new common_1.BadRequestException({
                error: {
                    code: 'TURNO_YA_CANCELADO',
                    message: 'El turno ya está cancelado.',
                },
            });
        }
        if (userRole !== rol_enum_1.Rol.ADMINISTRADOR && turno.usuario_id !== userId) {
            throw new common_1.ForbiddenException({
                error: {
                    code: 'SIN_PERMISOS',
                    message: 'No tiene permisos para cancelar este turno.',
                },
            });
        }
        const ahora = new Date();
        const fechaInicio = new Date(turno.fecha_inicio);
        const unaHoraEnMs = 60 * 60 * 1000;
        const diferencia = fechaInicio.getTime() - ahora.getTime();
        if (diferencia < unaHoraEnMs) {
            throw new common_1.BadRequestException({
                error: {
                    code: 'ANTICIPACION_INSUFICIENTE',
                    message: 'Debe cancelar con al menos 1 hora de anticipación.',
                },
            });
        }
        turno.estado = estado_turno_enum_1.EstadoTurno.CANCELADO;
        turno.cancelado_en = new Date();
        turno.cancelado_por = userId;
        const turnoActualizado = await this.turnoRepository.save(turno);
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
    async findTurnos(userId, userRole, filters) {
        const query = this.turnoRepository
            .createQueryBuilder('turno')
            .leftJoinAndSelect('turno.usuario', 'usuario')
            .leftJoinAndSelect('turno.cancha', 'cancha')
            .leftJoinAndSelect('turno.pago_turno', 'pago_turno')
            .where('turno.estado = :estado', { estado: estado_turno_enum_1.EstadoTurno.ACTIVO });
        if (userRole !== rol_enum_1.Rol.ADMINISTRADOR) {
            query.andWhere('turno.usuario_id = :userId', { userId });
        }
        if (userRole === rol_enum_1.Rol.ADMINISTRADOR) {
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
                fechaHasta.setHours(23, 59, 59, 999);
                query.andWhere('turno.fecha_inicio <= :fechaHasta', { fechaHasta });
            }
        }
        query.orderBy('turno.fecha_inicio', 'ASC');
        const turnos = await query.getMany();
        return turnos.map(turno => this.formatTurnoResponse(turno, userRole));
    }
    async findHistorial(userId, userRole, filters) {
        const query = this.turnoRepository
            .createQueryBuilder('turno')
            .leftJoinAndSelect('turno.usuario', 'usuario')
            .leftJoinAndSelect('turno.cancha', 'cancha');
        if (userRole !== rol_enum_1.Rol.ADMINISTRADOR) {
            query.where('turno.usuario_id = :userId', { userId });
        }
        if (userRole === rol_enum_1.Rol.ADMINISTRADOR) {
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
                fechaHasta.setHours(23, 59, 59, 999);
                query.andWhere('turno.fecha_inicio <= :fechaHasta', { fechaHasta });
            }
        }
        query.orderBy('turno.fecha_inicio', 'DESC');
        const turnos = await query.getMany();
        return turnos.map(turno => this.formatTurnoResponse(turno, userRole));
    }
    formatTurnoResponse(turno, userRole) {
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
        if (userRole === rol_enum_1.Rol.ADMINISTRADOR && turno.usuario) {
            return {
                ...baseResponse,
                usuario: {
                    id: turno.usuario.id,
                    nombre: turno.usuario.nombre,
                    apellido: turno.usuario.apellido,
                    email: turno.usuario.email,
                    rol: turno.usuario.rol,
                },
                pago_turno: turno.usuario.rol === rol_enum_1.Rol.NO_SOCIO ? {
                    pagado: !!turno.pago_turno,
                    fecha_pago: turno.pago_turno?.fecha_pago || null,
                    monto: turno.pago_turno?.monto || null,
                    metodo_pago: turno.pago_turno?.metodo_pago || null,
                } : null,
            };
        }
        return baseResponse;
    }
    getTimeString(date) {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    }
    overlapsTimeRange(start, end, rangeStart, rangeEnd) {
        return ((start >= rangeStart && start < rangeEnd) ||
            (end > rangeStart && end <= rangeEnd) ||
            (start <= rangeStart && end >= rangeEnd));
    }
};
exports.TurnosService = TurnosService;
exports.TurnosService = TurnosService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(turno_entity_1.Turno)),
    __param(1, (0, typeorm_1.InjectRepository)(cancha_entity_1.Cancha)),
    __param(2, (0, typeorm_1.InjectRepository)(cuota_entity_1.Cuota)),
    __param(3, (0, typeorm_1.InjectRepository)(pago_turno_entity_1.PagoTurno)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        configuracion_service_1.ConfiguracionService,
        tarifas_service_1.TarifasService])
], TurnosService);
//# sourceMappingURL=turnos.service.js.map