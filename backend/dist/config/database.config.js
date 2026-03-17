"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDatabaseConfig = void 0;
const entities_1 = require("../entities");
const getDatabaseConfig = (configService) => ({
    type: 'mssql',
    host: configService.get('DB_HOST', 'localhost'),
    port: parseInt(configService.get('DB_PORT', '1433'), 10),
    username: configService.get('DB_USER', 'sa'),
    password: configService.get('DB_PASSWORD', ''),
    database: configService.get('DB_NAME', 'club_tenis'),
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
    options: {
        encrypt: false,
        trustServerCertificate: true,
    },
});
exports.getDatabaseConfig = getDatabaseConfig;
//# sourceMappingURL=database.config.js.map