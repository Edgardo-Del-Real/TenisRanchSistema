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
exports.EstadisticasController = void 0;
const common_1 = require("@nestjs/common");
const estadisticas_service_1 = require("./estadisticas.service");
const filtro_estadisticas_dto_1 = require("./dto/filtro-estadisticas.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const rol_enum_1 = require("../common/enums/rol.enum");
let EstadisticasController = class EstadisticasController {
    constructor(estadisticasService) {
        this.estadisticasService = estadisticasService;
    }
    async getEstadisticasGenerales(filtros) {
        return this.estadisticasService.getEstadisticasGenerales(filtros);
    }
    async getEstadisticasFinancieras(filtros) {
        return this.estadisticasService.getEstadisticasFinancieras(filtros);
    }
};
exports.EstadisticasController = EstadisticasController;
__decorate([
    (0, common_1.Get)('generales'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [filtro_estadisticas_dto_1.FiltroEstadisticasDto]),
    __metadata("design:returntype", Promise)
], EstadisticasController.prototype, "getEstadisticasGenerales", null);
__decorate([
    (0, common_1.Get)('financieras'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [filtro_estadisticas_dto_1.FiltroEstadisticasDto]),
    __metadata("design:returntype", Promise)
], EstadisticasController.prototype, "getEstadisticasFinancieras", null);
exports.EstadisticasController = EstadisticasController = __decorate([
    (0, common_1.Controller)('estadisticas'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(rol_enum_1.Rol.ADMINISTRADOR),
    __metadata("design:paramtypes", [estadisticas_service_1.EstadisticasService])
], EstadisticasController);
//# sourceMappingURL=estadisticas.controller.js.map