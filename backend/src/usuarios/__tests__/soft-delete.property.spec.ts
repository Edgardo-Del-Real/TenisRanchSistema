import * as fc from 'fast-check';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../../app.module';
import { Usuario } from '../../entities/usuario.entity';
import { Rol } from '../../common/enums/rol.enum';
import { cleanupTestUsers } from '../../__tests__/test-helpers';

/**
 * Feature: gestion-club-tenis, Propiedad 11: Baja lógica conserva el historial
 *
 * Validates: Requirement 3.5
 *
 * Para cualquier usuario dado de baja, el registro debe permanecer en la base de datos
 * marcado como inactivo (activo=false), y todos sus datos históricos deben seguir siendo
 * accesibles para el Administrador.
 */

describe('Feature: gestion-club-tenis, Propiedad 11: Baja lógica conserva el historial', () => {
  let app: INestApplication;
  let usuarioRepository: Repository<Usuario>;

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
    'baja lógica conserva el registro en la BD con activo=false y sigue siendo accesible para el admin',
    async () => {
      const createdEmails: string[] = [];

      try {
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              adminEmail: fc.uuid().map((id) => `test-admin-softdel-${id}@example.com`),
              adminPassword: fc.stringMatching(/^[A-Za-z0-9]{8,20}$/),
              targetNombre: fc.stringMatching(/^[A-Za-z]{2,30}$/),
              targetApellido: fc.stringMatching(/^[A-Za-z]{2,30}$/),
              targetEmail: fc.uuid().map((id) => `test-target-softdel-${id}@example.com`),
              targetPassword: fc.stringMatching(/^[A-Za-z0-9]{8,20}$/),
              targetTelefono: fc.stringMatching(/^\d{7,15}$/),
            }),
            async (data) => {
              createdEmails.push(data.adminEmail, data.targetEmail);

              // Step 1: Create admin user directly via repository
              const passwordHash = await bcrypt.hash(data.adminPassword, 10);
              const adminUser = usuarioRepository.create({
                nombre: 'Admin',
                apellido: 'SoftDel',
                email: data.adminEmail,
                password_hash: passwordHash,
                telefono: '1234567890',
                rol: Rol.ADMINISTRADOR,
                activo: true,
              });
              await usuarioRepository.save(adminUser);

              // Step 2: Register target user via POST /api/auth/register
              const registerResponse = await request(app.getHttpServer())
                .post('/api/auth/register')
                .send({
                  nombre: data.targetNombre,
                  apellido: data.targetApellido,
                  email: data.targetEmail,
                  password: data.targetPassword,
                  telefono: data.targetTelefono,
                });
              expect(registerResponse.status).toBe(201);
              const targetId: string = registerResponse.body.id;

              // Step 3: Login as admin
              const loginResponse = await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({ email: data.adminEmail, password: data.adminPassword });
              expect(loginResponse.status).toBe(200);
              const adminToken: string = loginResponse.body.access_token;

              // Step 4: DELETE /api/usuarios/:targetId (soft delete)
              const deleteResponse = await request(app.getHttpServer())
                .delete(`/api/usuarios/${targetId}`)
                .set('Authorization', `Bearer ${adminToken}`);

              // Step 5: Assert response status is 200 with success message
              expect(deleteResponse.status).toBe(200);
              expect(deleteResponse.body.message).toBeDefined();

              // Step 6: Assert the user still exists in the DB with activo=false
              const userInDb = await usuarioRepository.findOne({ where: { id: targetId } });
              expect(userInDb).not.toBeNull();
              expect(userInDb!.activo).toBe(false);

              // Step 7: GET /api/usuarios/:targetId with admin token still returns the user (200)
              const getResponse = await request(app.getHttpServer())
                .get(`/api/usuarios/${targetId}`)
                .set('Authorization', `Bearer ${adminToken}`);
              expect(getResponse.status).toBe(200);

              // Step 8: Assert the returned user has activo=false
              expect(getResponse.body.activo).toBe(false);
            },
          ),
          { numRuns: 3 },
        );
      } finally {
        // Step 9: Clean up all created users after each iteration
        for (const email of createdEmails) {
          await usuarioRepository.delete({ email });
        }
      }
    },
    120000,
  );
});
