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
exports.TarifasService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const tarifa_entity_1 = require("../entities/tarifa.entity");
const tipo_tarifa_enum_1 = require("../common/enums/tipo-tarifa.enum");
let TarifasService = class TarifasService {
    constructor(tarifaRepository) {
        this.tarifaRepository = tarifaRepository;
    }
    async findVigentes() {
        const tipos = Object.values(tipo_tarifa_enum_1.TipoTarifa);
        const tarifas = [];
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
    async updateTarifa(tipo, dto, userId) {
        if (!Object.values(tipo_tarifa_enum_1.TipoTarifa).includes(tipo)) {
            throw new common_1.BadRequestException({
                error: {
                    code: 'TIPO_TARIFA_INVALIDO',
                    message: 'Tipo de tarifa inválido.',
                },
            });
        }
        const nuevaTarifa = this.tarifaRepository.create({
            tipo: tipo,
            valor: dto.valor,
            vigente_desde: new Date(),
            modificado_por: userId,
        });
        return this.tarifaRepository.save(nuevaTarifa);
    }
    async getHistorial(fechaDesde, fechaHasta, montoMin, montoMax) {
        const queryBuilder = this.tarifaRepository
            .createQueryBuilder('tarifa')
            .leftJoinAndSelect('tarifa.modificado_por_usuario', 'usuario')
            .orderBy('tarifa.vigente_desde', 'DESC');
        if (fechaDesde && fechaHasta) {
            queryBuilder.andWhere('tarifa.vigente_desde BETWEEN :fechaDesde AND :fechaHasta', {
                fechaDesde: new Date(fechaDesde),
                fechaHasta: new Date(fechaHasta),
            });
        }
        else if (fechaDesde) {
            queryBuilder.andWhere('tarifa.vigente_desde >= :fechaDesde', {
                fechaDesde: new Date(fechaDesde),
            });
        }
        else if (fechaHasta) {
            queryBuilder.andWhere('tarifa.vigente_desde <= :fechaHasta', {
                fechaHasta: new Date(fechaHasta),
            });
        }
        if (montoMin !== undefined && montoMax !== undefined) {
            queryBuilder.andWhere('tarifa.valor BETWEEN :montoMin AND :montoMax', {
                montoMin,
                montoMax,
            });
        }
        else if (montoMin !== undefined) {
            queryBuilder.andWhere('tarifa.valor >= :montoMin', { montoMin });
        }
        else if (montoMax !== undefined) {
            queryBuilder.andWhere('tarifa.valor <= :montoMax', { montoMax });
        }
        return queryBuilder.getMany();
    }
};
exports.TarifasService = TarifasService;
exports.TarifasService = TarifasService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(tarifa_entity_1.Tarifa)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], TarifasService);
//# sourceMappingURL=tarifas.service.js.map