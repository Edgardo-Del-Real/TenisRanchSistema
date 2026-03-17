"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstadisticasModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const estadisticas_controller_1 = require("./estadisticas.controller");
const estadisticas_service_1 = require("./estadisticas.service");
const usuario_entity_1 = require("../entities/usuario.entity");
const turno_entity_1 = require("../entities/turno.entity");
const cuota_entity_1 = require("../entities/cuota.entity");
const pago_cuota_entity_1 = require("../entities/pago-cuota.entity");
const pago_luz_entity_1 = require("../entities/pago-luz.entity");
const pago_turno_entity_1 = require("../entities/pago-turno.entity");
const cancha_entity_1 = require("../entities/cancha.entity");
let EstadisticasModule = class EstadisticasModule {
};
exports.EstadisticasModule = EstadisticasModule;
exports.EstadisticasModule = EstadisticasModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                usuario_entity_1.Usuario,
                turno_entity_1.Turno,
                cuota_entity_1.Cuota,
                pago_cuota_entity_1.PagoCuota,
                pago_luz_entity_1.PagoLuz,
                pago_turno_entity_1.PagoTurno,
                cancha_entity_1.Cancha,
            ]),
        ],
        controllers: [estadisticas_controller_1.EstadisticasController],
        providers: [estadisticas_service_1.EstadisticasService],
    })
], EstadisticasModule);
//# sourceMappingURL=estadisticas.module.js.map