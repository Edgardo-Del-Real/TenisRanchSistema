import * as fc from 'fast-check';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppModule } from '../../app.module';
import { Usuario } from '../../entities/usuario.entity';
import { cleanupTestUsers } from '../../__tests__/test-helpers';

/**
 * Feature: gestion-club-tenis, Propiedad 10: Actualización de datos personales no altera el rol
 *
 * Validates: Requirements 3.3, 3.4
 *
 * Para cualquier usuario (Socio o No_Socio) que actualice su información personal
 * (nombre, teléfono, contraseña), el rol y el estado del usuario deben permanecer
 * invariantes después de la actualización.
 */

describe('Feature: gestion-club-tenis, Propiedad 10: Actualización de datos personales no altera el rol', () => {
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
    'actualización de datos personales no altera el rol ni el estado activo',
    async () => {
      const createdEmails: string[] = [];

      try {
        await fc.assert(
          fc.asyncProperty(
            // User registration data
            fc.record({
              nombre: fc.stringMatching(/^[A-Za-z]{2,30}$/),
              apellido: fc.stringMatching(/^[A-Za-z]{2,30}$/),
              email: fc.uuid().map((id) => `test-perfil-${id}@example.com`),
              password: fc.stringMatching(/^[A-Za-z0-9]{8,20}$/),
              telefono: fc.stringMatching(/^\d{7,15}$/),
            }),
            // Update data: at least one of nombre, telefono, password provided
            fc
              .record(
                {
                  nombre: fc.option(fc.stringMatching(/^[A-Za-z]{2,30}$/), { nil: undefined }),
                  telefono: fc.option(fc.stringMatching(/^\d{7,15}$/), { nil: undefined }),
                  password: fc.option(fc.stringMatching(/^[A-Za-z0-9]{8,20}$/), { nil: undefined }),
                },
                { withDeletedKeys: false },
              )
              .filter(
                (u) =>
                  u.nombre !== undefined ||
                  u.telefono !== undefined ||
                  u.password !== undefined,
              ),
            async (userData, updateData) => {
              createdEmails.push(userData.email);

              // Step 1: Register user (gets NO_SOCIO role, activo=true)
              const registerResponse = await request(app.getHttpServer())
                .post('/api/auth/register')
                .send(userData);
              expect(registerResponse.status).toBe(201);

              // Step 2: Login to get token
              const loginResponse = await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({ email: userData.email, password: userData.password });
              expect(loginResponse.status).toBe(200);
              const token: string = loginResponse.body.access_token;

              // Build the patch body with only defined fields
              const patchBody: Record<string, string> = {};
              if (updateData.nombre !== undefined) patchBody.nombre = updateData.nombre;
              if (updateData.telefono !== undefined) patchBody.telefono = updateData.telefono;
              if (updateData.password !== undefined) patchBody.password = updateData.password;

              // Step 3: PATCH /api/usuarios/perfil
              const patchResponse = await request(app.getHttpServer())
                .patch('/api/usuarios/perfil')
                .set('Authorization', `Bearer ${token}`)
                .send(patchBody);

              // Step 4: Assert response status is 200
              expect(patchResponse.status).toBe(200);

              // Step 5: Assert rol is unchanged (no_socio)
              expect(patchResponse.body.rol).toBe('no_socio');

              // Step 6: Assert activo is unchanged (true)
              expect(patchResponse.body.activo).toBe(true);

              // Step 7: Assert updated fields are reflected in the response
              if (updateData.nombre !== undefined) {
                expect(patchResponse.body.nombre).toBe(updateData.nombre);
              }
              if (updateData.telefono !== undefined) {
                expect(patchResponse.body.telefono).toBe(updateData.telefono);
              }
              // password is never returned in the response body
            },
          ),
          { numRuns: 3 },
        );
      } finally {
        // Cleanup all created users after each iteration
        for (const email of createdEmails) {
          await usuarioRepository.delete({ email });
        }
      }
    },
    120000,
  );
});
