"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TurnosModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const turnos_controller_1 = require("./turnos.controller");
const turnos_service_1 = require("./turnos.service");
const turno_entity_1 = require("../entities/turno.entity");
const cancha_entity_1 = require("../entities/cancha.entity");
const cuota_entity_1 = require("../entities/cuota.entity");
const pago_turno_entity_1 = require("../entities/pago-turno.entity");
const configuracion_module_1 = require("../configuracion/configuracion.module");
const tarifas_module_1 = require("../tarifas/tarifas.module");
let TurnosModule = class TurnosModule {
};
exports.TurnosModule = TurnosModule;
exports.TurnosModule = TurnosModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([turno_entity_1.Turno, cancha_entity_1.Cancha, cuota_entity_1.Cuota, pago_turno_entity_1.PagoTurno]),
            configuracion_module_1.ConfiguracionModule,
            tarifas_module_1.TarifasModule,
        ],
        controllers: [turnos_controller_1.TurnosController],
        providers: [turnos_service_1.TurnosService],
        exports: [turnos_service_1.TurnosService],
    })
], TurnosModule);
//# sourceMappingURL=turnos.module.js.map