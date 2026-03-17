"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("../app.module");
const seed_service_1 = require("../seed/seed.service");
async function createAdmin() {
    console.log('🚀 Iniciando creación de usuario administrador...');
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const seedService = app.get(seed_service_1.SeedService);
    await seedService.seedDefaultAdmin();
    await app.close();
    console.log('✅ Proceso completado');
}
createAdmin().catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
});
//# sourceMappingURL=create-admin.js.map