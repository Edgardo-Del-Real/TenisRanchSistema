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
exports.PagosController = void 0;
const common_1 = require("@nestjs/common");
const pagos_service_1 = require("./pagos.service");
const create_pago_turno_dto_1 = require("./dto/create-pago-turno.dto");
const create_pago_luz_dto_1 = require("./dto/create-pago-luz.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const rol_enum_1 = require("../common/enums/rol.enum");
let PagosController = class PagosController {
    constructor(pagosService) {
        this.pagosService = pagosService;
    }
    async registrarPagoTurno(createPagoTurnoDto, req) {
        return await this.pagosService.registrarPagoTurno(createPagoTurnoDto, req.user.userId);
    }
    async registrarPagoLuz(createPagoLuzDto, req) {
        return await this.pagosService.registrarPagoLuz(createPagoLuzDto, req.user.userId);
    }
    async obtenerPagosLuz() {
        return await this.pagosService.obtenerPagosLuz();
    }
};
exports.PagosController = PagosController;
__decorate([
    (0, common_1.Post)('turnos'),
    (0, roles_decorator_1.Roles)(rol_enum_1.Rol.ADMINISTRADOR),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_pago_turno_dto_1.CreatePagoTurnoDto, Object]),
    __metadata("design:returntype", Promise)
], PagosController.prototype, "registrarPagoTurno", null);
__decorate([
    (0, common_1.Post)('luz'),
    (0, roles_decorator_1.Roles)(rol_enum_1.Rol.ADMINISTRADOR),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_pago_luz_dto_1.CreatePagoLuzDto, Object]),
    __metadata("design:returntype", Promise)
], PagosController.prototype, "registrarPagoLuz", null);
__decorate([
    (0, common_1.Get)('luz'),
    (0, roles_decorator_1.Roles)(rol_enum_1.Rol.ADMINISTRADOR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PagosController.prototype, "obtenerPagosLuz", null);
exports.PagosController = PagosController = __decorate([
    (0, common_1.Controller)('pagos'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [pagos_service_1.PagosService])
], PagosController);
//# sourceMappingURL=pagos.controller.js.map