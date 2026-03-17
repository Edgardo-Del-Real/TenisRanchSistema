import * as fc from 'fast-check';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppModule } from '../../app.module';
import { Usuario } from '../../entities/usuario.entity';

/**
 * Feature: gestion-club-tenis, Propiedad 2: Correo duplicado rechaza el registro
 *
 * Validates: Requirements 1.2
 *
 * Para cualquier correo electrónico ya registrado en el sistema, un intento de
 * registro con ese mismo correo debe ser rechazado sin crear un nuevo usuario.
 */

describe('Feature: gestion-club-tenis, Propiedad 2: Correo duplicado rechaza el registro', () => {
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
    'correo duplicado rechaza el registro',
    async () => {
      const createdEmails: string[] = [];

      try {
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              nombre: fc.stringMatching(/^[A-Za-z]{2,30}$/),
              apellido: fc.stringMatching(/^[A-Za-z]{2,30}$/),
              // uuid-based emails guarantee uniqueness across all 100 iterations
              email: fc.uuid().map((id) => `test-dup-${id}@example.com`),
              password: fc.stringMatching(/^[A-Za-z0-9]{8,20}$/),
              telefono: fc.stringMatching(/^\d{7,15}$/),
            }),
            async (userData) => {
              createdEmails.push(userData.email);

              // First registration — must succeed
              const firstResponse = await request(app.getHttpServer())
                .post('/api/auth/register')
                .send(userData);

              expect(firstResponse.status).toBe(201);

              // Second registration with the SAME email — must be rejected
              const secondResponse = await request(app.getHttpServer())
                .post('/api/auth/register')
                .send({
                  ...userData,
                  nombre: 'Otro',
                  apellido: 'Usuario',
                });

              // Assert 409 Conflict
              expect(secondResponse.status).toBe(409);

              // Assert error code
              expect(secondResponse.body.error.code).toBe('EMAIL_DUPLICADO');

              // Assert no new user was created — count must still be 1
              const count = await usuarioRepository.count({
                where: { email: userData.email },
              });
              expect(count).toBe(1);
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
    120000, // 2 minutes: 10 iterations × 2 HTTP round-trips each
  );
});
