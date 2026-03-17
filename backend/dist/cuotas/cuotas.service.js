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
exports.CuotasService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const schedule_1 = require("@nestjs/schedule");
const cuota_entity_1 = require("../entities/cuota.entity");
const pago_cuota_entity_1 = require("../entities/pago-cuota.entity");
const usuario_entity_1 = require("../entities/usuario.entity");
const tarifa_entity_1 = require("../entities/tarifa.entity");
const estado_cuota_enum_1 = require("../common/enums/estado-cuota.enum");
const rol_enum_1 = require("../common/enums/rol.enum");
const tipo_tarifa_enum_1 = require("../common/enums/tipo-tarifa.enum");
let CuotasService = class CuotasService {
    constructor(cuotaRepository, pagoCuotaRepository, usuarioRepository, tarifaRepository) {
        this.cuotaRepository = cuotaRepository;
        this.pagoCuotaRepository = pagoCuotaRepository;
        this.usuarioRepository = usuarioRepository;
        this.tarifaRepository = tarifaRepository;
    }
    async generarCuotasMensuales() {
        const now = new Date();
        const mes = now.getMonth() + 1;
        const anio = now.getFullYear();
        const tarifaCuota = await this.tarifaRepository.findOne({
            where: { tipo: tipo_tarifa_enum_1.TipoTarifa.CUOTA },
            order: { vigente_desde: 'DESC' },
        });
        if (!tarifaCuota) {
            console.error('No se encontró tarifa de cuota vigente para generar cuotas mensuales');
            return;
        }
        const sociosActivos = await this.usuarioRepository.find({
            where: { rol: rol_enum_1.Rol.SOCIO, activo: true },
        });
        for (const socio of sociosActivos) {
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
                    estado: estado_cuota_enum_1.EstadoCuota.PENDIENTE,
                });
                await this.cuotaRepository.save(nuevaCuota);
            }
        }
        console.log(`Cuotas generadas para ${sociosActivos.length} socios activos - ${mes}/${anio}`);
    }
    async findAll(filtros, userId, userRole) {
        const queryBuilder = this.cuotaRepository
            .createQueryBuilder('cuota')
            .leftJoinAndSelect('cuota.socio', 'socio')
            .orderBy('cuota.created_at', 'DESC');
        if (userRole !== rol_enum_1.Rol.ADMINISTRADOR && userId) {
            queryBuilder.andWhere('cuota.socio_id = :userId', { userId });
        }
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
        }
        else if (filtros.fechaDesde) {
            queryBuilder.andWhere('cuota.created_at >= :fechaDesde', {
                fechaDesde: new Date(filtros.fechaDesde),
            });
        }
        else if (filtros.fechaHasta) {
            queryBuilder.andWhere('cuota.created_at <= :fechaHasta', {
                fechaHasta: new Date(filtros.fechaHasta),
            });
        }
        const cuotas = await queryBuilder.getMany();
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
    async registrarPago(cuotaId, dto, registradoPor) {
        const cuota = await this.cuotaRepository.findOne({
            where: { id: cuotaId },
            relations: ['socio'],
        });
        if (!cuota) {
            throw new common_1.NotFoundException({
                error: {
                    code: 'CUOTA_NO_ENCONTRADA',
                    message: 'Cuota no encontrada.',
                },
            });
        }
        const saldoPendiente = Number(cuota.monto_total) - Number(cuota.monto_abonado);
        if (dto.monto > saldoPendiente) {
            throw new common_1.BadRequestException({
                error: {
                    code: 'MONTO_EXCEDE_SALDO',
                    message: 'El monto del pago excede el saldo pendiente de la cuota.',
                },
            });
        }
        const pago = this.pagoCuotaRepository.create({
            cuota_id: cuotaId,
            monto: dto.monto,
            fecha_pago: new Date(),
            registrado_por: registradoPor,
        });
        await this.pagoCuotaRepository.save(pago);
        cuota.monto_abonado = Number(cuota.monto_abonado) + dto.monto;
        if (cuota.monto_abonado >= Number(cuota.monto_total)) {
            cuota.estado = estado_cuota_enum_1.EstadoCuota.PAGADA;
        }
        else if (cuota.monto_abonado > 0) {
            cuota.estado = estado_cuota_enum_1.EstadoCuota.PARCIAL;
        }
        else {
            cuota.estado = estado_cuota_enum_1.EstadoCuota.PENDIENTE;
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
    async generarCuotasManuales(monto) {
        const now = new Date();
        const mes = now.getMonth() + 1;
        const anio = now.getFullYear();
        const sociosActivos = await this.usuarioRepository.find({
            where: { rol: rol_enum_1.Rol.SOCIO, activo: true },
        });
        let cuotasGeneradas = 0;
        for (const socio of sociosActivos) {
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
                    estado: estado_cuota_enum_1.EstadoCuota.PENDIENTE,
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
    async getCuotasImpagas(socioId) {
        const count = await this.cuotaRepository.count({
            where: {
                socio_id: socioId,
                estado: estado_cuota_enum_1.EstadoCuota.PENDIENTE,
            },
        });
        return count;
    }
    async getPagos(cuotaId, userId, userRole) {
        const cuota = await this.cuotaRepository.findOne({
            where: { id: cuotaId },
        });
        if (!cuota) {
            throw new common_1.NotFoundException({
                error: {
                    code: 'CUOTA_NO_ENCONTRADA',
                    message: 'Cuota no encontrada.',
                },
            });
        }
        if (userRole !== rol_enum_1.Rol.ADMINISTRADOR && cuota.socio_id !== userId) {
            throw new common_1.NotFoundException({
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
};
exports.CuotasService = CuotasService;
__decorate([
    (0, schedule_1.Cron)('1 0 1 * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CuotasService.prototype, "generarCuotasMensuales", null);
exports.CuotasService = CuotasService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(cuota_entity_1.Cuota)),
    __param(1, (0, typeorm_1.InjectRepository)(pago_cuota_entity_1.PagoCuota)),
    __param(2, (0, typeorm_1.InjectRepository)(usuario_entity_1.Usuario)),
    __param(3, (0, typeorm_1.InjectRepository)(tarifa_entity_1.Tarifa)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], CuotasService);
//# sourceMappingURL=cuotas.service.js.map