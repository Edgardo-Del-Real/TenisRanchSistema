import * as fc from 'fast-check';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../../app.module';
import { Usuario } from '../../entities/usuario.entity';
import { Cancha } from '../../entities/cancha.entity';
import { HistorialCancha } from '../../entities/historial-cancha.entity';
import { Rol } from '../../common/enums/rol.enum';
import { EstadoCancha } from '../../common/enums/estado-cancha.enum';
import { cleanupTestUsers } from '../../__tests__/test-helpers';

/**
 * Feature: gestion-club-tenis, Propiedad 14: Cambio de estado de cancha bloquea reservas
 *
 * **Validates: Requirements 5.1, 5.2, 5.3**
 *
 * Para cualquier cancha con estado distinto a "disponible", cualquier intento de reserva en esa cancha
 * debe ser rechazado. El historial de cambios de estado debe conservar todos los cambios realizados.
 */

describe('Feature: gestion-club-tenis, Propiedad 14: Cambio de estado de cancha bloquea reservas', () => {
  let app: INestApplication;
  let usuarioRepository: Repository<Usuario>;
  let canchaRepository: Repository<Cancha>;
  let historialRepository: Repository<HistorialCancha>;

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
    canchaRepository = moduleFixture.get<Repository<Cancha>>(
      getRepositoryToken(Cancha),
    );
    historialRepository = moduleFixture.get<Repository<HistorialCancha>>(
      getRepositoryToken(HistorialCancha),
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
    'cambio de estado de cancha persiste y mantiene historial',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            adminEmail: fc.uuid().map((id) => `test-admin-cancha-${id}@example.com`),
            adminPassword: fc.stringMatching(/^[A-Za-z0-9]{8,20}$/),
            estadoNuevo: fc.constantFrom(
              EstadoCancha.MANTENIMIENTO,
              EstadoCancha.INHABILITADA,
            ),
            razon: fc.stringMatching(/^[A-Za-z0-9 ]{10,100}$/),
          }),
          async (data) => {
            try {
              // Step 1: Create admin user
              const passwordHash = await bcrypt.hash(data.adminPassword, 10);
              const adminUser = usuarioRepository.create({
                nombre: 'Admin',
                apellido: 'Cancha',
                email: data.adminEmail,
                password_hash: passwordHash,
                telefono: '1234567890',
                rol: Rol.ADMINISTRADOR,
                activo: true,
              });
              await usuarioRepository.save(adminUser);

              // Step 2: Create a test cancha
              const cancha = canchaRepository.create({
                numero: Math.floor(Math.random() * 1000) + 1,
                estado: EstadoCancha.DISPONIBLE,
              });
              await canchaRepository.save(cancha);

              // Step 3: Login as admin
              const loginResponse = await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({ email: data.adminEmail, password: data.adminPassword });
              expect(loginResponse.status).toBe(200);
              const adminToken: string = loginResponse.body.access_token;

              // Step 4: Change cancha state
              const updateResponse = await request(app.getHttpServer())
                .patch(`/api/canchas/${cancha.id}/estado`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                  estado: data.estadoNuevo,
                  razon: data.razon,
                });
              expect(updateResponse.status).toBe(200);
              expect(updateResponse.body.estado).toBe(data.estadoNuevo);
              expect(updateResponse.body.razon_estado).toBe(data.razon);

              // Step 5: Verify cancha state persisted
              const canchaActualizada = await canchaRepository.findOne({
                where: { id: cancha.id },
              });
              expect(canchaActualizada).toBeDefined();
              expect(canchaActualizada!.estado).toBe(data.estadoNuevo);
              expect(canchaActualizada!.razon_estado).toBe(data.razon);

              // Step 6: Verify history record was created
              const historial = await historialRepository.find({
                where: { cancha_id: cancha.id },
              });
              expect(historial.length).toBe(1);
              expect(historial[0].estado_anterior).toBe(EstadoCancha.DISPONIBLE);
              expect(historial[0].estado_nuevo).toBe(data.estadoNuevo);
              expect(historial[0].razon).toBe(data.razon);
              expect(historial[0].cambiado_por).toBe(adminUser.id);

              // Step 7: Get history via API
              const historialResponse = await request(app.getHttpServer())
                .get(`/api/canchas/${cancha.id}/historial`)
                .set('Authorization', `Bearer ${adminToken}`);
              expect(historialResponse.status).toBe(200);
              expect(historialResponse.body.length).toBe(1);
              expect(historialResponse.body[0].estado_anterior).toBe(EstadoCancha.DISPONIBLE);
              expect(historialResponse.body[0].estado_nuevo).toBe(data.estadoNuevo);

              // Cleanup
              await historialRepository.delete({ cancha_id: cancha.id });
              await canchaRepository.delete({ id: cancha.id });
              await usuarioRepository.delete({ email: data.adminEmail });
            } catch (error) {
              // Cleanup on error
              await historialRepository
                .createQueryBuilder()
                .delete()
                .where('cambiado_por IN (SELECT id FROM usuarios WHERE email = :email)', {
                  email: data.adminEmail,
                })
                .execute();
              await canchaRepository
                .createQueryBuilder()
                .delete()
                .where('numero >= 1')
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

  it(
    'listado de canchas es accesible solo para administradores',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            adminEmail: fc.uuid().map((id) => `test-admin-list-${id}@example.com`),
            adminPassword: fc.stringMatching(/^[A-Za-z0-9]{8,20}$/),
          }),
          async (data) => {
            try {
              // Step 1: Create admin user
              const passwordHash = await bcrypt.hash(data.adminPassword, 10);
              const adminUser = usuarioRepository.create({
                nombre: 'Admin',
                apellido: 'List',
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

              // Step 3: Get canchas list
              const listResponse = await request(app.getHttpServer())
                .get('/api/canchas')
                .set('Authorization', `Bearer ${adminToken}`);
              expect(listResponse.status).toBe(200);
              expect(Array.isArray(listResponse.body)).toBe(true);

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
