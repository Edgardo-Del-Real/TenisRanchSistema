import * as fc from 'fast-check';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../app.module';

/**
 * Feature: gestion-club-tenis, Propiedad 7: Endpoints protegidos requieren autenticación
 *
 * Validates: Requirements 2.5, 15.4
 *
 * Para cualquier endpoint protegido de la API, una solicitud sin token o con token
 * inválido debe ser rechazada con código 401.
 */

describe('Feature: gestion-club-tenis, Propiedad 7: Endpoints protegidos requieren autenticación', () => {
  let app: INestApplication;

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
  }, 30000);

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  }, 30000);

  it(
    'endpoints protegidos rechazan solicitudes sin token o con token inválido con 401',
    async () => {
      const protectedEndpoints: Array<{ method: string; path: string }> = [
        { method: 'POST', path: '/api/auth/logout' },
        { method: 'GET', path: '/api/usuarios' },
        { method: 'PATCH', path: '/api/usuarios/perfil' },
        { method: 'GET', path: '/api/usuarios/solicitar-socio' },
      ];

      await fc.assert(
        fc.asyncProperty(
          // Pick a random protected endpoint
          fc.constantFrom(...protectedEndpoints),
          // Generate either no token (null) or a random invalid token string
          fc.oneof(
            fc.constant(null),
            fc.string({ minLength: 10, maxLength: 200 }),
          ),
          async (endpoint, tokenOrNull) => {
            const req = request(app.getHttpServer());
            let call: request.Test;

            if (endpoint.method === 'GET') {
              call = req.get(endpoint.path);
            } else if (endpoint.method === 'POST') {
              call = req.post(endpoint.path);
            } else if (endpoint.method === 'PATCH') {
              call = req.patch(endpoint.path);
            } else {
              call = req.get(endpoint.path);
            }

            if (tokenOrNull !== null) {
              call = call.set('Authorization', `Bearer ${tokenOrNull}`);
            }
            // If tokenOrNull is null, no Authorization header is sent

            const response = await call;

            expect(response.status).toBe(401);
          },
        ),
        { numRuns: 3 },
      );
    },
    120000, // 2 minutes: 10 iterations × HTTP round-trips
  );
});
