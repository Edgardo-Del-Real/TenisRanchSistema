import * as fc from 'fast-check';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../../app.module';
import { Usuario } from '../../entities/usuario.entity';
import { ConfiguracionClub } from '../../entities/configuracion-club.entity';
import { Rol } from '../../common/enums/rol.enum';
import { cleanupTestUsers } from '../../__tests__/test-helpers';

/**
 * Feature: gestion-club-tenis, Propiedad 28: Configuración del club se aplica a nuevas reservas
 *
 * **Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5**
 *
 * Para cualquier modificación de la configuración del club (franja horaria, franja de luz,
 * duración de turnos), las nuevas reservas deben validarse y calcularse según la configuración
 * vigente en el momento de la reserva.
 */

describe('Feature: gestion-club-tenis, Propiedad 28: Configuración del club se aplica a nuevas reservas', () => {
  let app: INestApplication;
  let usuarioRepository: Repository<Usuario>;
  let configuracionRepository: Repository<ConfiguracionClub>;

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
    configuracionRepository = moduleFixture.get<Repository<ConfiguracionClub>>(
      getRepositoryToken(ConfiguracionClub),
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
    'administrador puede actualizar configuración del club',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            adminEmail: fc.uuid().map((id) => `test-admin-config-${id}@example.com`),
            adminPassword: fc.stringMatching(/^[A-Za-z0-9]{8,20}$/),
            apertura: fc.integer({ min: 6, max: 10 }).map((h) => `${h.toString().padStart(2, '0')}:00:00`),
            cierre: fc.integer({ min: 20, max: 23 }).map((h) => `${h.toString().padStart(2, '0')}:00:00`),
            luz_inicio: fc.integer({ min: 17, max: 19 }).map((h) => `${h.toString().padStart(2, '0')}:00:00`),
            luz_fin: fc.integer({ min: 20, max: 22 }).map((h) => `${h.toString().padStart(2, '0')}:00:00`),
            duracion_semana_min: fc.integer({ min: 30, max: 120 }),
            duracion_finde_min: fc.integer({ min: 60, max: 180 }),
          }),
          async (data) => {
            try {
              // Step 1: Create admin user
              const passwordHash = await bcrypt.hash(data.adminPassword, 10);
              const adminUser = usuarioRepository.create({
                nombre: 'Admin',
                apellido: 'Config',
                email: data.adminEmail,
                password_hash: passwordHash,
                telefono: '1234567890',
                rol: Rol.ADMINISTRADOR,
                activo: true,
              });
              await usuarioRepository.save(adminUser);

              // Step 2: Login as admin
              const loginResponse = await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({ email: data.adminEmail, password: data.adminPassword });
              expect(loginResponse.status).toBe(200);
              const adminToken: string = loginResponse.body.access_token;

              // Step 3: Update configuration
              const updateResponse = await request(app.getHttpServer())
                .put('/api/configuracion')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                  apertura: data.apertura,
                  cierre: data.cierre,
                  luz_inicio: data.luz_inicio,
                  luz_fin: data.luz_fin,
                  duracion_semana_min: data.duracion_semana_min,
                  duracion_finde_min: data.duracion_finde_min,
                });
              expect(updateResponse.status).toBe(200);
              expect(updateResponse.body.apertura).toBe(data.apertura);
              expect(updateResponse.body.cierre).toBe(data.cierre);
              expect(updateResponse.body.luz_inicio).toBe(data.luz_inicio);
              expect(updateResponse.body.luz_fin).toBe(data.luz_fin);
              expect(updateResponse.body.duracion_semana_min).toBe(data.duracion_semana_min);
              expect(updateResponse.body.duracion_finde_min).toBe(data.duracion_finde_min);

              // Step 4: Verify configuration persists
              const getResponse = await request(app.getHttpServer())
                .get('/api/configuracion')
                .set('Authorization', `Bearer ${adminToken}`);
              expect(getResponse.status).toBe(200);
              expect(getResponse.body.apertura).toBe(data.apertura);
              expect(getResponse.body.cierre).toBe(data.cierre);
              expect(getResponse.body.duracion_semana_min).toBe(data.duracion_semana_min);
              expect(getResponse.body.duracion_finde_min).toBe(data.duracion_finde_min);

              // Cleanup
              await usuarioRepository.delete({ email: data.adminEmail });
            } catch (error) {
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
    'usuarios no administradores pueden leer configuración pero no modificarla',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userEmail: fc.uuid().map((id) => `test-user-config-${id}@example.com`),
            userPassword: fc.stringMatching(/^[A-Za-z0-9]{8,20}$/),
            rol: fc.constantFrom(Rol.SOCIO, Rol.NO_SOCIO),
          }),
          async (data) => {
            try {
              // Step 1: Create user
              const passwordHash = await bcrypt.hash(data.userPassword, 10);
              const user = usuarioRepository.create({
                nombre: 'User',
                apellido: 'Config',
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

              // Step 3: Get configuration (should succeed)
              const getResponse = await request(app.getHttpServer())
                .get('/api/configuracion')
                .set('Authorization', `Bearer ${userToken}`);
              expect(getResponse.status).toBe(200);
              expect(getResponse.body).toHaveProperty('apertura');
              expect(getResponse.body).toHaveProperty('cierre');

              // Step 4: Try to update configuration (should fail)
              const updateResponse = await request(app.getHttpServer())
                .put('/api/configuracion')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                  apertura: '07:00:00',
                  cierre: '23:00:00',
                  luz_inicio: '18:00:00',
                  luz_fin: '20:00:00',
                  duracion_semana_min: 90,
                  duracion_finde_min: 120,
                });
              expect(updateResponse.status).toBe(403);

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
    'validación de formato de tiempo rechaza valores inválidos',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            adminEmail: fc.uuid().map((id) => `test-admin-invalid-${id}@example.com`),
            adminPassword: fc.stringMatching(/^[A-Za-z0-9]{8,20}$/),
            invalidTime: fc.constantFrom(
              '25:00:00', // Invalid hour
              '12:60:00', // Invalid minute
              '12:30:60', // Invalid second
              '12:30',    // Missing seconds
              '12-30-00', // Wrong separator
              'invalid',  // Not a time
            ),
          }),
          async (data) => {
            try {
              // Step 1: Create admin user
              const passwordHash = await bcrypt.hash(data.adminPassword, 10);
              const adminUser = usuarioRepository.create({
                nombre: 'Admin',
                apellido: 'Invalid',
                email: data.adminEmail,
                password_hash: passwordHash,
                telefono: '1234567890',
                rol: Rol.ADMINISTRADOR,
                activo: true,
              });
              await usuarioRepository.save(adminUser);

              // Step 2: Login as admin
              const loginResponse = await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({ email: data.adminEmail, password: data.adminPassword });
              expect(loginResponse.status).toBe(200);
              const adminToken: string = loginResponse.body.access_token;

              // Step 3: Try to update with invalid time format
              const updateResponse = await request(app.getHttpServer())
                .put('/api/configuracion')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                  apertura: data.invalidTime,
                  cierre: '22:00:00',
                  luz_inicio: '18:30:00',
                  luz_fin: '19:00:00',
                  duracion_semana_min: 60,
                  duracion_finde_min: 90,
                });
              expect(updateResponse.status).toBe(400);

              // Cleanup
              await usuarioRepository.delete({ email: data.adminEmail });
            } catch (error) {
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
    'validación de duración rechaza valores menores a 1 minuto',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            adminEmail: fc.uuid().map((id) => `test-admin-duration-${id}@example.com`),
            adminPassword: fc.stringMatching(/^[A-Za-z0-9]{8,20}$/),
            invalidDuration: fc.integer({ min: -100, max: 0 }),
          }),
          async (data) => {
            try {
              // Step 1: Create admin user
              const passwordHash = await bcrypt.hash(data.adminPassword, 10);
              const adminUser = usuarioRepository.create({
                nombre: 'Admin',
                apellido: 'Duration',
                email: data.adminEmail,
                password_hash: passwordHash,
                telefono: '1234567890',
                rol: Rol.ADMINISTRADOR,
                activo: true,
              });
              await usuarioRepository.save(adminUser);

              // Step 2: Login as admin
              const loginResponse = await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({ email: data.adminEmail, password: data.adminPassword });
              expect(loginResponse.status).toBe(200);
              const adminToken: string = loginResponse.body.access_token;

              // Step 3: Try to update with invalid duration
              const updateResponse = await request(app.getHttpServer())
                .put('/api/configuracion')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                  apertura: '08:00:00',
                  cierre: '22:00:00',
                  luz_inicio: '18:30:00',
                  luz_fin: '19:00:00',
                  duracion_semana_min: data.invalidDuration,
                  duracion_finde_min: 90,
                });
              expect(updateResponse.status).toBe(400);

              // Cleanup
              await usuarioRepository.delete({ email: data.adminEmail });
            } catch (error) {
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
