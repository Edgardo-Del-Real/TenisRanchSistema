"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TarifasModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const tarifa_entity_1 = require("../entities/tarifa.entity");
const tarifas_controller_1 = require("./tarifas.controller");
const tarifas_service_1 = require("./tarifas.service");
const auth_module_1 = require("../auth/auth.module");
let TarifasModule = class TarifasModule {
};
exports.TarifasModule = TarifasModule;
exports.TarifasModule = TarifasModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([tarifa_entity_1.Tarifa]),
            auth_module_1.AuthModule,
        ],
        controllers: [tarifas_controller_1.TarifasController],
        providers: [tarifas_service_1.TarifasService],
        exports: [tarifas_service_1.TarifasService],
    })
], TarifasModule);
//# sourceMappingURL=tarifas.module.js.map