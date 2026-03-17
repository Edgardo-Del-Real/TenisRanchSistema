import * as fc from 'fast-check';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { AppModule } from '../../app.module';
import { Usuario } from '../../entities/usuario.entity';
import { Tarifa } from '../../entities/tarifa.entity';
import { Rol } from '../../common/enums/rol.enum';
import { TipoTarifa } from '../../common/enums/tipo-tarifa.enum';
import { cleanupTestUsers } from '../../__tests__/test-helpers';

/**
 * Feature: gestion-club-tenis, Propiedad 26: Modificación de tarifa conserva historial y actualiza vigente
 *
 * **Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5**
 *
 * Para cualquier tipo de tarifa (turno No_Socio, luz, cuota mensual), al modificar su valor,
 * el nuevo valor debe quedar como vigente con la fecha de modificación, y el valor anterior
 * debe permanecer en el historial. La consulta de tarifas vigentes debe devolver siempre
 * el valor más reciente de cada tipo.
 */

describe('Feature: gestion-club-tenis, Propiedad 26: Modificación de tarifa conserva historial y actualiza vigente', () => {
  let app: INestApplication;
  let usuarioRepository: Repository<Usuario>;
  let tarifaRepository: Repository<Tarifa>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );

    await app.init();

    usuarioRepository = moduleFixture.get<Repository<Usuario>>(
      getRepositoryToken(Usuario),
    );
    tarifaRepository = moduleFixture.get<Repository<Tarifa>>(
      getRepositoryToken(Tarifa),
    );
  }, 30000);

  beforeEach(async () => {
    await cleanupTestUsers(usuarioRepository);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  }, 30000);

  it(
    'modificación de tarifa conserva historial y actualiza vigente',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            adminEmail: fc.uuid().map((id) => `test-admin-tarifa-${id}@example.com`),
            adminPassword: fc.stringMatching(/^[A-Za-z0-9]{8,20}$/),
            tipoTarifa: fc.constantFrom(
              TipoTarifa.TURNO_NO_SOCIO,
              TipoTarifa.LUZ,
              TipoTarifa.CUOTA,
            ),
            valorInicial: fc.float({ min: 100, max: 10000 }).map((v) => Math.round(v * 100) / 100),
            valorNuevo: fc.float({ min: 100, max: 10000 }).map((v) => Math.round(v * 100) / 100),
          }),
          async (data) => {
            try {
              // Step 1: Create admin user
              const passwordHash = await bcrypt.hash(data.adminPassword, 10);
              const adminUser = usuarioRepository.create({
                nombre: 'Admin',
                apellido: 'Tarifa',
                email: data.adminEmail,
                password_hash: passwordHash,
                telefono: '1234567890',
                rol: Rol.ADMINISTRADOR,
                activo: true,
              });
              await usuarioRepository.save(adminUser);

              // Step 2: Create initial tarifa
              const tarifaInicial = tarifaRepository.create({
                tipo: data.tipoTarifa,
                valor: data.valorInicial,
                vigente_desde: new Date(),
                modificado_por: adminUser.id,
              });
              await tarifaRepository.save(tarifaInicial);

              // Step 3: Login as admin
              const loginResponse = await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({ email: data.adminEmail, password: data.adminPassword });
              expect(loginResponse.status).toBe(200);
              const adminToken: string = loginResponse.body.access_token;

              // Step 4: Update tarifa
              const updateResponse = await request(app.getHttpServer())
                .put(`/api/tarifas/${data.tipoTarifa}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ valor: data.valorNuevo });
              expect(updateResponse.status).toBe(200);
              expect(parseFloat(updateResponse.body.valor)).toBe(data.valorNuevo);
              expect(updateResponse.body.tipo).toBe(data.tipoTarifa);

              // Step 5: Verify vigente tarifa is the new one
              const vigentesResponse = await request(app.getHttpServer())
                .get('/api/tarifas')
                .set('Authorization', `Bearer ${adminToken}`);
              expect(vigentesResponse.status).toBe(200);
              
              const tarifaVigente = vigentesResponse.body.find(
                (t: any) => t.tipo === data.tipoTarifa,
              );
              expect(tarifaVigente).toBeDefined();
              expect(parseFloat(tarifaVigente.valor)).toBe(data.valorNuevo);

              // Step 6: Verify historial contains both values
              const historialResponse = await request(app.getHttpServer())
                .get('/api/tarifas/historial')
                .set('Authorization', `Bearer ${adminToken}`);
              expect(historialResponse.status).toBe(200);
              
              const historialTipo = historialResponse.body.filter(
                (t: any) => t.tipo === data.tipoTarifa,
              );
              expect(historialTipo.length).toBeGreaterThanOrEqual(2);
              
              const valores = historialTipo.map((t: any) => parseFloat(t.valor));
              expect(valores).toContain(data.valorInicial);
              expect(valores).toContain(data.valorNuevo);

              // Cleanup
              await tarifaRepository.delete({ tipo: data.tipoTarifa });
              await usuarioRepository.delete({ email: data.adminEmail });
            } catch (error) {
              // Cleanup on error
              await tarifaRepository.delete({ tipo: data.tipoTarifa });
              await usuarioRepository.delete({ email: data.adminEmail });
              throw error;
            }
          },
        ),
        { numRuns: 3 },
      );
    },
    120000,
  );

  it(
    'consulta de tarifas vigentes es accesible para todos los usuarios autenticados',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userEmail: fc.uuid().map((id) => `test-user-tarifa-${id}@example.com`),
            userPassword: fc.stringMatching(/^[A-Za-z0-9]{8,20}$/),
            rol: fc.constantFrom(Rol.SOCIO, Rol.NO_SOCIO),
          }),
          async (data) => {
            try {
              // Step 1: Create user
              const passwordHash = await bcrypt.hash(data.userPassword, 10);
              const user = usuarioRepository.create({
                nombre: 'User',
                apellido: 'Tarifa',
                email: data.userEmail,
                password_hash: passwordHash,
                telefono: '1234567890',
                rol: data.rol,
                activo: true,
              });
              await usuarioRepository.save(user);

              // Step 2: Login
              const loginResponse = await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({ email: data.userEmail, password: data.userPassword });
              expect(loginResponse.status).toBe(200);
              const userToken: string = loginResponse.body.access_token;

              // Step 3: Get tarifas vigentes
              const vigentesResponse = await request(app.getHttpServer())
                .get('/api/tarifas')
                .set('Authorization', `Bearer ${userToken}`);
              expect(vigentesResponse.status).toBe(200);
              expect(Array.isArray(vigentesResponse.body)).toBe(true);

              // Cleanup
              await usuarioRepository.delete({ email: data.userEmail });
            } catch (error) {
              await usuarioRepository.delete({ email: data.userEmail });
              throw error;
            }
          },
        ),
        { numRuns: 3 },
      );
    },
    120000,
  );

  it(
    'historial de tarifas es accesible solo para administradores',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            socioEmail: fc.uuid().map((id) => `test-socio-tarifa-${id}@example.com`),
            socioPassword: fc.stringMatching(/^[A-Za-z0-9]{8,20}$/),
          }),
          async (data) => {
            try {
              // Step 1: Create socio user
              const passwordHash = await bcrypt.hash(data.socioPassword, 10);
              const socio = usuarioRepository.create({
                nombre: 'Socio',
                apellido: 'Tarifa',
                email: data.socioEmail,
                password_hash: passwordHash,
                telefono: '1234567890',
                rol: Rol.SOCIO,
                activo: true,
              });
              await usuarioRepository.save(socio);

              // Step 2: Login as socio
              const loginResponse = await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({ email: data.socioEmail, password: data.socioPassword });
              expect(loginResponse.status).toBe(200);
              const socioToken: string = loginResponse.body.access_token;

              // Step 3: Try to access historial (should be forbidden)
              const historialResponse = await request(app.getHttpServer())
                .get('/api/tarifas/historial')
                .set('Authorization', `Bearer ${socioToken}`);
              expect(historialResponse.status).toBe(403);

              // Cleanup
              await usuarioRepository.delete({ email: data.socioEmail });
            } catch (error) {
              await usuarioRepository.delete({ email: data.socioEmail });
              throw error;
            }
          },
        ),
        { numRuns: 3 },
      );
    },
    120000,
  );

  it(
    'filtros de historial funcionan correctamente',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            adminEmail: fc.uuid().map((id) => `test-admin-filter-${id}@example.com`),
            adminPassword: fc.stringMatching(/^[A-Za-z0-9]{8,20}$/),
            montoMin: fc.integer({ min: 100, max: 5000 }),
            montoMax: fc.integer({ min: 5001, max: 10000 }),
          }),
          async (data) => {
            try {
              // Step 1: Create admin user
              const passwordHash = await bcrypt.hash(data.adminPassword, 10);
              const adminUser = usuarioRepository.create({
                nombre: 'Admin',
                apellido: 'Filter',
                email: data.adminEmail,
                password_hash: passwordHash,
                telefono: '1234567890',
                rol: Rol.ADMINISTRADOR,
                activo: true,
              });
              await usuarioRepository.save(adminUser);

              // Step 2: Create tarifas with different values
              const tarifaBaja = tarifaRepository.create({
                tipo: TipoTarifa.LUZ,
                valor: data.montoMin - 50,
                vigente_desde: new Date(),
                modificado_por: adminUser.id,
              });
              const tarifaMedia = tarifaRepository.create({
                tipo: TipoTarifa.TURNO_NO_SOCIO,
                valor: (data.montoMin + data.montoMax) / 2,
                vigente_desde: new Date(),
                modificado_por: adminUser.id,
              });
              const tarifaAlta = tarifaRepository.create({
                tipo: TipoTarifa.CUOTA,
                valor: data.montoMax + 50,
                vigente_desde: new Date(),
                modificado_por: adminUser.id,
              });
              await tarifaRepository.save([tarifaBaja, tarifaMedia, tarifaAlta]);

              // Step 3: Login as admin
              const loginResponse = await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({ email: data.adminEmail, password: data.adminPassword });
              expect(loginResponse.status).toBe(200);
              const adminToken: string = loginResponse.body.access_token;

              // Step 4: Filter by monto range
              const filteredResponse = await request(app.getHttpServer())
                .get('/api/tarifas/historial')
                .query({ monto_min: data.montoMin, monto_max: data.montoMax })
                .set('Authorization', `Bearer ${adminToken}`);
              expect(filteredResponse.status).toBe(200);
              
              // All returned tarifas should be within range
              filteredResponse.body.forEach((t: any) => {
                const valor = parseFloat(t.valor);
                expect(valor).toBeGreaterThanOrEqual(data.montoMin);
                expect(valor).toBeLessThanOrEqual(data.montoMax);
              });

              // Cleanup
              await tarifaRepository.delete({ modificado_por: adminUser.id });
              await usuarioRepository.delete({ email: data.adminEmail });
            } catch (error) {
              await tarifaRepository
                .createQueryBuilder()
                .delete()
                .where('modificado_por IN (SELECT id FROM usuarios WHERE email = :email)', {
                  email: data.adminEmail,
                })
                .execute();
              await usuarioRepository.delete({ email: data.adminEmail });
              throw error;
            }
          },
        ),
        { numRuns: 3 },
      );
    },
    120000,
  );
});

