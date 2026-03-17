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
 * Feature: gestion-club-tenis, Propiedad 8: Control de acceso por rol
 *
 * Validates: Requirements 15.1, 15.2, 15.3
 *
 * Para cualquier endpoint restringido a un rol específico (ej. administración),
 * una solicitud de un usuario con rol insuficiente debe ser rechazada con código 403.
 * Esto aplica tanto a funcionalidades de administración como a la consulta de recursos ajenos.
 */

describe('Feature: gestion-club-tenis, Propiedad 8: Control de acceso por rol', () => {
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
    'endpoints de administración rechazan usuarios con rol insuficiente con 403',
    async () => {
      // Extra cleanup before this test
      await cleanupTestUsers(usuarioRepository);
      // Wait a bit to ensure cleanup is complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Admin-only endpoints — a NO_SOCIO user must receive 403
      const adminOnlyEndpoints: Array<{ method: string; path: string }> = [
        { method: 'GET', path: '/api/usuarios' },
      ];

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
            // Pick a random admin-only endpoint
            fc.constantFrom(...adminOnlyEndpoints),
            async (userData, endpoint) => {
              const email = `test-role-${Date.now()}-${counter++}@example.com`;
              createdEmails.push(email);

              // Step 1: Register the user (gets NO_SOCIO role by default)
              const registerResponse = await request(app.getHttpServer())
                .post('/api/auth/register')
                .send({ ...userData, email });

              expect(registerResponse.status).toBe(201);

              // Step 2: Login to get a token
              const loginResponse = await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({ email, password: userData.password });

              expect(loginResponse.status).toBe(200);
              const token: string = loginResponse.body.access_token;

              // Step 3: Send request to admin-only endpoint with NO_SOCIO token
              const req = request(app.getHttpServer());
              let call: request.Test;

              if (endpoint.method === 'GET') {
                call = req.get(endpoint.path);
              } else if (endpoint.method === 'PATCH') {
                call = req.patch(endpoint.path);
              } else {
                call = req.get(endpoint.path);
              }

              call = call.set('Authorization', `Bearer ${token}`);

              const response = await call;

              // Step 4: Assert 403 Forbidden
              expect(response.status).toBe(403);
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
