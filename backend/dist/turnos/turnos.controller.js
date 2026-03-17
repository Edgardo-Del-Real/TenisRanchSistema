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
exports.TurnosController = void 0;
const common_1 = require("@nestjs/common");
const turnos_service_1 = require("./turnos.service");
const create_turno_dto_1 = require("./dto/create-turno.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let TurnosController = class TurnosController {
    constructor(turnosService) {
        this.turnosService = turnosService;
    }
    create(dto, req) {
        return this.turnosService.create(dto, req.user.userId, req.user.rol);
    }
    findTurnos(req, nombre, apellido, fechaDesde, fechaHasta) {
        return this.turnosService.findTurnos(req.user.userId, req.user.rol, { nombre, apellido, fechaDesde, fechaHasta });
    }
    findHistorial(req, nombre, apellido, fechaDesde, fechaHasta) {
        return this.turnosService.findHistorial(req.user.userId, req.user.rol, { nombre, apellido, fechaDesde, fechaHasta });
    }
    cancel(id, req) {
        return this.turnosService.cancelTurno(id, req.user.userId, req.user.rol);
    }
};
exports.TurnosController = TurnosController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_turno_dto_1.CreateTurnoDto, Object]),
    __metadata("design:returntype", void 0)
], TurnosController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('nombre')),
    __param(2, (0, common_1.Query)('apellido')),
    __param(3, (0, common_1.Query)('fecha_desde')),
    __param(4, (0, common_1.Query)('fecha_hasta')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String]),
    __metadata("design:returntype", void 0)
], TurnosController.prototype, "findTurnos", null);
__decorate([
    (0, common_1.Get)('historial'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('nombre')),
    __param(2, (0, common_1.Query)('apellido')),
    __param(3, (0, common_1.Query)('fecha_desde')),
    __param(4, (0, common_1.Query)('fecha_hasta')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String]),
    __metadata("design:returntype", void 0)
], TurnosController.prototype, "findHistorial", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TurnosController.prototype, "cancel", null);
exports.TurnosController = TurnosController = __decorate([
    (0, common_1.Controller)('turnos'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [turnos_service_1.TurnosService])
], TurnosController);
//# sourceMappingURL=turnos.controller.js.map