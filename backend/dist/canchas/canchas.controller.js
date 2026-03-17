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
exports.CanchasController = void 0;
const common_1 = require("@nestjs/common");
const canchas_service_1 = require("./canchas.service");
const update_estado_cancha_dto_1 = require("./dto/update-estado-cancha.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const rol_enum_1 = require("../common/enums/rol.enum");
let CanchasController = class CanchasController {
    constructor(canchasService) {
        this.canchasService = canchasService;
    }
    findAll() {
        return this.canchasService.findAll();
    }
    updateEstado(id, dto, req) {
        return this.canchasService.updateEstado(id, dto, req.user.id);
    }
    getHistorial(id) {
        return this.canchasService.getHistorial(id);
    }
};
exports.CanchasController = CanchasController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CanchasController.prototype, "findAll", null);
__decorate([
    (0, common_1.Patch)(':id/estado'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(rol_enum_1.Rol.ADMINISTRADOR),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_estado_cancha_dto_1.UpdateEstadoCanchaDto, Object]),
    __metadata("design:returntype", void 0)
], CanchasController.prototype, "updateEstado", null);
__decorate([
    (0, common_1.Get)(':id/historial'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(rol_enum_1.Rol.ADMINISTRADOR),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CanchasController.prototype, "getHistorial", null);
exports.CanchasController = CanchasController = __decorate([
    (0, common_1.Controller)('canchas'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [canchas_service_1.CanchasService])
], CanchasController);
//# sourceMappingURL=canchas.controller.js.map