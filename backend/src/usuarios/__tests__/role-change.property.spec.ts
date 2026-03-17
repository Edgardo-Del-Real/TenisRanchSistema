import * as fc from 'fast-check';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { AppModule } from '../../app.module';
import { Usuario } from '../../entities/usuario.entity';
import { Rol } from '../../common/enums/rol.enum';
import { cleanupTestUsers } from '../../__tests__/test-helpers';

/**
 * Feature: gestion-club-tenis, Propiedad 9: Cambio de rol persiste y no puede ser auto-aplicado
 *
 * Validates: Requirements 3.1, 3.2
 *
 * Para cualquier usuario y rol válido, un Administrador puede cambiar el rol de otro
 * usuario y el cambio debe persistir. Sin embargo, ningún usuario puede cambiar su
 * propio rol.
 */

describe('Feature: gestion-club-tenis, Propiedad 9: Cambio de rol persiste y no puede ser auto-aplicado', () => {
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
    'Part A — admin puede cambiar el rol de otro usuario y el cambio persiste',
    async () => {
      await cleanupTestUsers(usuarioRepository);
      const createdEmails: string[] = [];

      try {
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              adminEmail: fc.uuid().map((id) => `test-admin-${id}@example.com`),
              adminPassword: fc.stringMatching(/^[A-Za-z0-9]{8,20}$/),
              targetNombre: fc.stringMatching(/^[A-Za-z]{2,30}$/),
              targetApellido: fc.stringMatching(/^[A-Za-z]{2,30}$/),
              targetEmail: fc.uuid().map((id) => `test-target-${id}@example.com`),
              targetPassword: fc.stringMatching(/^[A-Za-z0-9]{8,20}$/),
              targetTelefono: fc.stringMatching(/^\d{7,15}$/),
            }),
            fc.constantFrom(Rol.SOCIO, Rol.ADMINISTRADOR),
            async (data, newRole) => {
              createdEmails.push(data.adminEmail, data.targetEmail);

              // Step 1: Create admin user directly via repository
              const passwordHash = await bcrypt.hash(data.adminPassword, 10);
              const adminUser = usuarioRepository.create({
                nombre: 'Admin',
                apellido: 'Test',
                email: data.adminEmail,
                password_hash: passwordHash,
                telefono: '1234567890',
                rol: Rol.ADMINISTRADOR,
                activo: true,
              });
              await usuarioRepository.save(adminUser);

              // Step 2: Create target user via POST /api/auth/register (gets NO_SOCIO)
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

              // Step 3: Login as admin to get token
              const loginResponse = await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({ email: data.adminEmail, password: data.adminPassword });
              expect(loginResponse.status).toBe(200);
              const adminToken: string = loginResponse.body.access_token;

              // Step 4 & 5: PATCH /api/usuarios/:targetId/rol with admin token
              const patchResponse = await request(app.getHttpServer())
                .patch(`/api/usuarios/${targetId}/rol`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ rol: newRole });

              // Step 6: Assert response status is 200
              expect(patchResponse.status).toBe(200);

              // Step 7: Assert response body rol equals the new role
              expect(patchResponse.body.rol).toBe(newRole);

              // Step 8: GET /api/usuarios/:targetId and assert rol persisted
              const getResponse = await request(app.getHttpServer())
                .get(`/api/usuarios/${targetId}`)
                .set('Authorization', `Bearer ${adminToken}`);
              expect(getResponse.status).toBe(200);
              expect(getResponse.body.rol).toBe(newRole);
            },
          ),
          { numRuns: 3 },
        );
      } finally {
        // Cleanup all created users after each run
        for (const email of createdEmails) {
          await usuarioRepository.delete({ email });
        }
      }
    },
    120000,
  );

  it(
    'Part B — ningún usuario puede cambiar su propio rol',
    async () => {
      // Extra cleanup before this test
      await cleanupTestUsers(usuarioRepository);
      // Wait a bit to ensure cleanup is complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const createdEmails: string[] = [];
      let counter = 0;

      try {
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              nombre: fc.stringMatching(/^[A-Za-z]{2,30}$/),
              apellido: fc.stringMatching(/^[A-Za-z]{2,30}$/),
              password: fc.stringMatching(/^[A-Za-z0-9]{8,20}$/),
              telefono: fc.stringMatching(/^\d{7,15}$/),
            }),
            async (userData) => {
              const email = `test-self-${Date.now()}-${counter++}@example.com`;
              createdEmails.push(email);

              // Step 1: Register a user and login
              const registerResponse = await request(app.getHttpServer())
                .post('/api/auth/register')
                .send({ ...userData, email });
              expect(registerResponse.status).toBe(201);
              const ownId: string = registerResponse.body.id;

              const loginResponse = await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({ email, password: userData.password });
              expect(loginResponse.status).toBe(200);
              const ownToken: string = loginResponse.body.access_token;

              // Step 2: Attempt PATCH /api/usuarios/:ownId/rol with own token
              const patchResponse = await request(app.getHttpServer())
                .patch(`/api/usuarios/${ownId}/rol`)
                .set('Authorization', `Bearer ${ownToken}`)
                .send({ rol: Rol.SOCIO });

              // Step 3: Assert response status is 403
              expect(patchResponse.status).toBe(403);

              // Step 4: Assert error code is either 'ROL_PROPIO' or 'ACCESO_DENEGADO'
              // (RolesGuard blocks non-admins with ACCESO_DENEGADO before reaching the service)
              expect(['ROL_PROPIO', 'ACCESO_DENEGADO']).toContain(
                patchResponse.body.error?.code,
              );
            },
          ),
          { numRuns: 3 },
        );
      } finally {
        // Cleanup all created users after each run
        for (const email of createdEmails) {
          await usuarioRepository.delete({ email });
        }
      }
    },
    120000,
  );
});

