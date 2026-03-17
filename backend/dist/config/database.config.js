"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDatabaseConfig = void 0;
const entities_1 = require("../entities");
const getDatabaseConfig = (configService) => ({
    type: 'postgres',
    url: configService.get('DATABASE_URL'),
    ssl: configService.get('NODE_ENV') === 'production'
        ? { rejectUnauthorized: false }
        : false,
    entities: [
        entities_1.Usuario,
        entities_1.Cancha,
        entities_1.HistorialCancha,
        entities_1.Turno,
        entities_1.Cuota,
        entities_1.PagoCuota,
        entities_1.Tarifa,
        entities_1.ConfiguracionClub,
        entities_1.PagoLuz,
        entities_1.PagoTurno,
    ],
    synchronize: configService.get('NODE_ENV') !== 'production',
    logging: configService.get('NODE_ENV') === 'development',
});
exports.getDatabaseConfig = getDatabaseConfig;
//# sourceMappingURL=database.config.js.map