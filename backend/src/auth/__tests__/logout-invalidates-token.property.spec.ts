import * as fc from 'fast-check';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppModule } from '../../app.module';
import { Usuario } from '../../entities/usuario.entity';

/**
 * Feature: gestion-club-tenis, Propiedad 6: Logout invalida el token
 *
 * Validates: Requirement 2.4
 *
 * Para cualquier sesión activa, después de ejecutar el logout, el token previamente
 * emitido no debe ser aceptado por ningún endpoint protegido.
 */

describe('Feature: gestion-club-tenis, Propiedad 6: Logout invalida el token', () => {
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

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  }, 30000);

  it(
    'después del logout el token queda invalidado y es rechazado por endpoints protegidos',
    async () => {
      const createdEmails: string[] = [];

      try {
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              nombre: fc.stringMatching(/^[A-Za-z]{2,30}$/),
              apellido: fc.stringMatching(/^[A-Za-z]{2,30}$/),
              email: fc.uuid().map((id) => `test-logout-${id}@example.com`),
              password: fc.stringMatching(/^[A-Za-z0-9]{8,20}$/),
              telefono: fc.stringMatching(/^\d{7,15}$/),
            }),
            async (userData) => {
              createdEmails.push(userData.email);

              // 1. Register the user
              const registerResponse = await request(app.getHttpServer())
                .post('/api/auth/register')
                .send(userData);
              expect(registerResponse.status).toBe(201);

              // 2. Login to get a token
              const loginResponse = await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({ email: userData.email, password: userData.password });
              expect(loginResponse.status).toBe(200);
              const token: string = loginResponse.body.access_token;
              expect(token).toBeDefined();

              // 3. Logout with the token — should succeed with 200
              const logoutResponse = await request(app.getHttpServer())
                .post('/api/auth/logout')
                .set('Authorization', `Bearer ${token}`);
              expect(logoutResponse.status).toBe(200);

              // 4. Try to use the same token on a protected endpoint (logout again)
              // The token is now blacklisted, so it must be rejected with 401
              const secondLogoutResponse = await request(app.getHttpServer())
                .post('/api/auth/logout')
                .set('Authorization', `Bearer ${token}`);
              expect(secondLogoutResponse.status).toBe(401);
            },
          ),
          { numRuns: 3 },
        );
      } finally {
        // Teardown: delete all users created during this test run
        for (const email of createdEmails) {
          await usuarioRepository.delete({ email });
        }
      }
    },
    120000, // 2 minutes: 10 iterations × HTTP round-trips
  );
});
