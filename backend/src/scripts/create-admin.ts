import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { SeedService } from '../seed/seed.service';

async function createAdmin() {
  console.log('🚀 Iniciando creación de usuario administrador...');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  const seedService = app.get(SeedService);
  
  await seedService.seedDefaultAdmin();
  
  await app.close();
  console.log('✅ Proceso completado');
}

createAdmin().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});