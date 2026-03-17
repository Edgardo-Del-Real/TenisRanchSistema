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
exports.TarifasController = void 0;
const common_1 = require("@nestjs/common");
const tarifas_service_1 = require("./tarifas.service");
const update_tarifa_dto_1 = require("./dto/update-tarifa.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const rol_enum_1 = require("../common/enums/rol.enum");
let TarifasController = class TarifasController {
    constructor(tarifasService) {
        this.tarifasService = tarifasService;
    }
    findVigentes() {
        return this.tarifasService.findVigentes();
    }
    updateTarifa(tipo, dto, req) {
        return this.tarifasService.updateTarifa(tipo, dto, req.user.userId);
    }
    getHistorial(fechaDesde, fechaHasta, montoMin, montoMax) {
        return this.tarifasService.getHistorial(fechaDesde, fechaHasta, montoMin ? parseFloat(montoMin) : undefined, montoMax ? parseFloat(montoMax) : undefined);
    }
};
exports.TarifasController = TarifasController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TarifasController.prototype, "findVigentes", null);
__decorate([
    (0, common_1.Put)(':tipo'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(rol_enum_1.Rol.ADMINISTRADOR),
    __param(0, (0, common_1.Param)('tipo')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_tarifa_dto_1.UpdateTarifaDto, Object]),
    __metadata("design:returntype", void 0)
], TarifasController.prototype, "updateTarifa", null);
__decorate([
    (0, common_1.Get)('historial'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(rol_enum_1.Rol.ADMINISTRADOR),
    __param(0, (0, common_1.Query)('fecha_desde')),
    __param(1, (0, common_1.Query)('fecha_hasta')),
    __param(2, (0, common_1.Query)('monto_min')),
    __param(3, (0, common_1.Query)('monto_max')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], TarifasController.prototype, "getHistorial", null);
exports.TarifasController = TarifasController = __decorate([
    (0, common_1.Controller)('tarifas'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [tarifas_service_1.TarifasService])
], TarifasController);
//# sourceMappingURL=tarifas.controller.js.map