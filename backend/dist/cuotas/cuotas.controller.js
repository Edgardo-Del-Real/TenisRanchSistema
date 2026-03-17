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
exports.CuotasController = void 0;
const common_1 = require("@nestjs/common");
const cuotas_service_1 = require("./cuotas.service");
const create_pago_cuota_dto_1 = require("./dto/create-pago-cuota.dto");
const generar_cuotas_dto_1 = require("./dto/generar-cuotas.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const rol_enum_1 = require("../common/enums/rol.enum");
const estado_cuota_enum_1 = require("../common/enums/estado-cuota.enum");
let CuotasController = class CuotasController {
    constructor(cuotasService) {
        this.cuotasService = cuotasService;
    }
    async findAll(query, req) {
        const filtros = {};
        if (query.nombre)
            filtros.nombre = query.nombre;
        if (query.apellido)
            filtros.apellido = query.apellido;
        if (query.estado && Object.values(estado_cuota_enum_1.EstadoCuota).includes(query.estado)) {
            filtros.estado = query.estado;
        }
        if (query.fechaDesde)
            filtros.fechaDesde = query.fechaDesde;
        if (query.fechaHasta)
            filtros.fechaHasta = query.fechaHasta;
        return this.cuotasService.findAll(filtros, req.user.userId, req.user.rol);
    }
    async generarCuotas(dto) {
        return this.cuotasService.generarCuotasManuales(dto.monto);
    }
    async registrarPago(cuotaId, dto, req) {
        return this.cuotasService.registrarPago(cuotaId, dto, req.user.userId);
    }
    async getPagos(cuotaId, req) {
        return this.cuotasService.getPagos(cuotaId, req.user.userId, req.user.rol);
    }
};
exports.CuotasController = CuotasController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], CuotasController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)('generar'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(rol_enum_1.Rol.ADMINISTRADOR),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [generar_cuotas_dto_1.GenerarCuotasDto]),
    __metadata("design:returntype", Promise)
], CuotasController.prototype, "generarCuotas", null);
__decorate([
    (0, common_1.Post)(':id/pagos'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(rol_enum_1.Rol.ADMINISTRADOR),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_pago_cuota_dto_1.CreatePagoCuotaDto, Object]),
    __metadata("design:returntype", Promise)
], CuotasController.prototype, "registrarPago", null);
__decorate([
    (0, common_1.Get)(':id/pagos'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CuotasController.prototype, "getPagos", null);
exports.CuotasController = CuotasController = __decorate([
    (0, common_1.Controller)('cuotas'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [cuotas_service_1.CuotasService])
], CuotasController);
//# sourceMappingURL=cuotas.controller.js.map