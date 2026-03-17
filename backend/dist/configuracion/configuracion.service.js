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
exports.ConfiguracionService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const configuracion_club_entity_1 = require("../entities/configuracion-club.entity");
let ConfiguracionService = class ConfiguracionService {
    constructor(configuracionRepository) {
        this.configuracionRepository = configuracionRepository;
    }
    async getConfiguracion() {
        const config = await this.configuracionRepository.findOne({
            where: {},
            order: { updated_at: 'DESC' },
        });
        if (!config) {
            throw new common_1.NotFoundException({
                error: {
                    code: 'CONFIGURACION_NO_ENCONTRADA',
                    message: 'No se encontró la configuración del club.',
                },
            });
        }
        return config;
    }
    async updateConfiguracion(dto) {
        let config = await this.configuracionRepository.findOne({
            where: {},
            order: { updated_at: 'DESC' },
        });
        if (!config) {
            config = this.configuracionRepository.create(dto);
        }
        else {
            config.apertura = dto.apertura;
            config.cierre = dto.cierre;
            config.luz_inicio = dto.luz_inicio;
            config.luz_fin = dto.luz_fin;
            config.duracion_semana_min = dto.duracion_semana_min;
            config.duracion_finde_min = dto.duracion_finde_min;
        }
        return this.configuracionRepository.save(config);
    }
};
exports.ConfiguracionService = ConfiguracionService;
exports.ConfiguracionService = ConfiguracionService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(configuracion_club_entity_1.ConfiguracionClub)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ConfiguracionService);
//# sourceMappingURL=configuracion.service.js.map