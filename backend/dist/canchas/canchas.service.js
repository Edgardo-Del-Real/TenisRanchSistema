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
exports.CanchasService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const cancha_entity_1 = require("../entities/cancha.entity");
const historial_cancha_entity_1 = require("../entities/historial-cancha.entity");
let CanchasService = class CanchasService {
    constructor(canchaRepository, historialRepository) {
        this.canchaRepository = canchaRepository;
        this.historialRepository = historialRepository;
    }
    async findAll() {
        return this.canchaRepository.find();
    }
    async updateEstado(id, dto, userId) {
        const cancha = await this.canchaRepository.findOne({ where: { id } });
        if (!cancha) {
            throw new common_1.NotFoundException({
                error: {
                    code: 'CANCHA_NO_ENCONTRADA',
                    message: 'Cancha no encontrada.',
                },
            });
        }
        const estadoAnterior = cancha.estado;
        const historial = this.historialRepository.create({
            cancha_id: id,
            estado_anterior: estadoAnterior,
            estado_nuevo: dto.estado,
            razon: dto.razon,
            cambiado_por: userId,
        });
        await this.historialRepository.save(historial);
        cancha.estado = dto.estado;
        cancha.razon_estado = dto.razon;
        return this.canchaRepository.save(cancha);
    }
    async getHistorial(id) {
        const cancha = await this.canchaRepository.findOne({ where: { id } });
        if (!cancha) {
            throw new common_1.NotFoundException({
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
};
exports.CanchasService = CanchasService;
exports.CanchasService = CanchasService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(cancha_entity_1.Cancha)),
    __param(1, (0, typeorm_1.InjectRepository)(historial_cancha_entity_1.HistorialCancha)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], CanchasService);
//# sourceMappingURL=canchas.service.js.map