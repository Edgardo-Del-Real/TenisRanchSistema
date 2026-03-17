"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const schedule_1 = require("@nestjs/schedule");
const database_config_1 = require("./config/database.config");
const auth_module_1 = require("./auth/auth.module");
const usuarios_module_1 = require("./usuarios/usuarios.module");
const canchas_module_1 = require("./canchas/canchas.module");
const tarifas_module_1 = require("./tarifas/tarifas.module");
const configuracion_module_1 = require("./configuracion/configuracion.module");
const turnos_module_1 = require("./turnos/turnos.module");
const cuotas_module_1 = require("./cuotas/cuotas.module");
const pagos_module_1 = require("./pagos/pagos.module");
const estadisticas_module_1 = require("./estadisticas/estadisticas.module");
const seed_module_1 = require("./seed/seed.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: database_config_1.getDatabaseConfig,
            }),
            schedule_1.ScheduleModule.forRoot(),
            seed_module_1.SeedModule,
            auth_module_1.AuthModule,
            usuarios_module_1.UsuariosModule,
            canchas_module_1.CanchasModule,
            tarifas_module_1.TarifasModule,
            configuracion_module_1.ConfiguracionModule,
            turnos_module_1.TurnosModule,
            cuotas_module_1.CuotasModule,
            pagos_module_1.PagosModule,
            estadisticas_module_1.EstadisticasModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map