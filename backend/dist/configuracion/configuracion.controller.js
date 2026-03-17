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
exports.ConfiguracionController = void 0;
const common_1 = require("@nestjs/common");
const configuracion_service_1 = require("./configuracion.service");
const update_configuracion_dto_1 = require("./dto/update-configuracion.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const rol_enum_1 = require("../common/enums/rol.enum");
let ConfiguracionController = class ConfiguracionController {
    constructor(configuracionService) {
        this.configuracionService = configuracionService;
    }
    getConfiguracion() {
        return this.configuracionService.getConfiguracion();
    }
    updateConfiguracion(dto) {
        return this.configuracionService.updateConfiguracion(dto);
    }
};
exports.ConfiguracionController = ConfiguracionController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ConfiguracionController.prototype, "getConfiguracion", null);
__decorate([
    (0, common_1.Put)(),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(rol_enum_1.Rol.ADMINISTRADOR),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [update_configuracion_dto_1.UpdateConfiguracionDto]),
    __metadata("design:returntype", void 0)
], ConfiguracionController.prototype, "updateConfiguracion", null);
exports.ConfiguracionController = ConfiguracionController = __decorate([
    (0, common_1.Controller)('configuracion'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [configuracion_service_1.ConfiguracionService])
], ConfiguracionController);
//# sourceMappingURL=configuracion.controller.js.map