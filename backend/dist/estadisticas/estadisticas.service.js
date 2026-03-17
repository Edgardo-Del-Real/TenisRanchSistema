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
exports.EstadisticasService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const usuario_entity_1 = require("../entities/usuario.entity");
const turno_entity_1 = require("../entities/turno.entity");
const cuota_entity_1 = require("../entities/cuota.entity");
const pago_cuota_entity_1 = require("../entities/pago-cuota.entity");
const pago_luz_entity_1 = require("../entities/pago-luz.entity");
const pago_turno_entity_1 = require("../entities/pago-turno.entity");
const cancha_entity_1 = require("../entities/cancha.entity");
const rol_enum_1 = require("../common/enums/rol.enum");
const estado_turno_enum_1 = require("../common/enums/estado-turno.enum");
let EstadisticasService = class EstadisticasService {
    constructor(usuarioRepository, turnoRepository, cuotaRepository, pagoCuotaRepository, pagoLuzRepository, pagoTurnoRepository, canchaRepository) {
        this.usuarioRepository = usuarioRepository;
        this.turnoRepository = turnoRepository;
        this.cuotaRepository = cuotaRepository;
        this.pagoCuotaRepository = pagoCuotaRepository;
        this.pagoLuzRepository = pagoLuzRepository;
        this.pagoTurnoRepository = pagoTurnoRepository;
        this.canchaRepository = canchaRepository;
    }
    async getEstadisticasGenerales(filtros) {
        const totalSociosActivos = await this.usuarioRepository.count({
            where: {
                rol: rol_enum_1.Rol.SOCIO,
                activo: true,
            },
        });
        const whereConditions = {
            estado: estado_turno_enum_1.EstadoTurno.ACTIVO,
        };
        if (filtros.fechaInicio && filtros.fechaFin) {
            whereConditions.fecha_inicio = (0, typeorm_2.Between)(new Date(filtros.fechaInicio), new Date(filtros.fechaFin));
        }
        else if (filtros.fechaInicio) {
            whereConditions.fecha_inicio = (0, typeorm_2.Between)(new Date(filtros.fechaInicio), new Date());
        }
        else if (filtros.fechaFin) {
            whereConditions.fecha_inicio = (0, typeorm_2.Between)(new Date('1900-01-01'), new Date(filtros.fechaFin));
        }
        const totalTurnos = await this.turnoRepository.count({
            where: whereConditions,
        });
        const canchasMasUtilizadasRaw = await this.turnoRepository
            .createQueryBuilder('turno')
            .select('cancha.numero', 'numero')
            .addSelect('COUNT(turno.id)', 'cantidad')
            .innerJoin('turno.cancha', 'cancha')
            .where('turno.estado = :estado', { estado: estado_turno_enum_1.EstadoTurno.ACTIVO })
            .andWhere(filtros.fechaInicio && filtros.fechaFin
            ? 'turno.fecha_inicio BETWEEN :fechaInicio AND :fechaFin'
            : filtros.fechaInicio
                ? 'turno.fecha_inicio >= :fechaInicio'
                : filtros.fechaFin
                    ? 'turno.fecha_inicio <= :fechaFin'
                    : '1=1', {
            fechaInicio: filtros.fechaInicio,
            fechaFin: filtros.fechaFin,
        })
            .groupBy('cancha.numero')
            .orderBy('COUNT(turno.id)', 'DESC')
            .getRawMany();
        const canchasMasUtilizadas = canchasMasUtilizadasRaw.sort((a, b) => {
            if (b.cantidad !== a.cantidad) {
                return b.cantidad - a.cantidad;
            }
            return a.numero - b.numero;
        });
        const horasPicoRaw = await this.turnoRepository
            .createQueryBuilder('turno')
            .select('EXTRACT(HOUR FROM turno.fecha_inicio)', 'hora')
            .addSelect('COUNT(turno.id)', 'cantidad')
            .where('turno.estado = :estado', { estado: estado_turno_enum_1.EstadoTurno.ACTIVO })
            .andWhere(filtros.fechaInicio && filtros.fechaFin
            ? 'turno.fecha_inicio BETWEEN :fechaInicio AND :fechaFin'
            : filtros.fechaInicio
                ? 'turno.fecha_inicio >= :fechaInicio'
                : filtros.fechaFin
                    ? 'turno.fecha_inicio <= :fechaFin'
                    : '1=1', {
            fechaInicio: filtros.fechaInicio,
            fechaFin: filtros.fechaFin,
        })
            .groupBy('EXTRACT(HOUR FROM turno.fecha_inicio)')
            .orderBy('COUNT(turno.id)', 'DESC')
            .getRawMany();
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
    async getEstadisticasFinancieras(filtros) {
        const whereConditionsPagos = {};
        const whereConditionsTurnos = {};
        if (filtros.fechaInicio && filtros.fechaFin) {
            whereConditionsPagos.fecha_pago = (0, typeorm_2.Between)(new Date(filtros.fechaInicio), new Date(filtros.fechaFin));
            whereConditionsTurnos.fecha_inicio = (0, typeorm_2.Between)(new Date(filtros.fechaInicio), new Date(filtros.fechaFin));
        }
        else if (filtros.fechaInicio) {
            whereConditionsPagos.fecha_pago = (0, typeorm_2.Between)(new Date(filtros.fechaInicio), new Date());
            whereConditionsTurnos.fecha_inicio = (0, typeorm_2.Between)(new Date(filtros.fechaInicio), new Date());
        }
        else if (filtros.fechaFin) {
            whereConditionsPagos.fecha_pago = (0, typeorm_2.Between)(new Date('1900-01-01'), new Date(filtros.fechaFin));
            whereConditionsTurnos.fecha_inicio = (0, typeorm_2.Between)(new Date('1900-01-01'), new Date(filtros.fechaFin));
        }
        const recaudacionCuotas = await this.pagoCuotaRepository
            .createQueryBuilder('pago')
            .select('SUM(pago.monto)', 'total')
            .where(Object.keys(whereConditionsPagos).length > 0
            ? 'pago.fecha_pago BETWEEN :fechaInicio AND :fechaFin'
            : '1=1', {
            fechaInicio: filtros.fechaInicio || '1900-01-01',
            fechaFin: filtros.fechaFin || new Date().toISOString(),
        })
            .getRawOne();
        const recaudacionTurnosNoSocio = await this.pagoTurnoRepository
            .createQueryBuilder('pago')
            .select('SUM(pago.monto)', 'total')
            .where(Object.keys(whereConditionsPagos).length > 0
            ? 'pago.fecha_pago BETWEEN :fechaInicio AND :fechaFin'
            : '1=1', {
            fechaInicio: filtros.fechaInicio || '1900-01-01',
            fechaFin: filtros.fechaFin || new Date().toISOString(),
        })
            .getRawOne();
        const cargosLuz = await this.turnoRepository
            .createQueryBuilder('turno')
            .select('SUM(turno.costo_luz)', 'total')
            .where('turno.requiere_luz = :requiereLuz', { requiereLuz: true })
            .andWhere('turno.estado = :estado', { estado: estado_turno_enum_1.EstadoTurno.ACTIVO })
            .andWhere(Object.keys(whereConditionsTurnos).length > 0
            ? 'turno.fecha_inicio BETWEEN :fechaInicio AND :fechaFin'
            : '1=1', {
            fechaInicio: filtros.fechaInicio || '1900-01-01',
            fechaFin: filtros.fechaFin || new Date().toISOString(),
        })
            .getRawOne();
        const pagosLuz = await this.pagoLuzRepository
            .createQueryBuilder('pago')
            .select('SUM(pago.monto)', 'total')
            .where(Object.keys(whereConditionsPagos).length > 0
            ? 'pago.fecha_pago BETWEEN :fechaInicio AND :fechaFin'
            : '1=1', {
            fechaInicio: filtros.fechaInicio || '1900-01-01',
            fechaFin: filtros.fechaFin || new Date().toISOString(),
        })
            .getRawOne();
        return {
            recaudacionCuotas: parseFloat(recaudacionCuotas?.total || '0'),
            recaudacionTurnosNoSocio: parseFloat(recaudacionTurnosNoSocio?.total || '0'),
            cargosLuz: parseFloat(cargosLuz?.total || '0'),
            pagosLuz: parseFloat(pagosLuz?.total || '0'),
        };
    }
};
exports.EstadisticasService = EstadisticasService;
exports.EstadisticasService = EstadisticasService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(usuario_entity_1.Usuario)),
    __param(1, (0, typeorm_1.InjectRepository)(turno_entity_1.Turno)),
    __param(2, (0, typeorm_1.InjectRepository)(cuota_entity_1.Cuota)),
    __param(3, (0, typeorm_1.InjectRepository)(pago_cuota_entity_1.PagoCuota)),
    __param(4, (0, typeorm_1.InjectRepository)(pago_luz_entity_1.PagoLuz)),
    __param(5, (0, typeorm_1.InjectRepository)(pago_turno_entity_1.PagoTurno)),
    __param(6, (0, typeorm_1.InjectRepository)(cancha_entity_1.Cancha)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], EstadisticasService);
//# sourceMappingURL=estadisticas.service.js.map