import * as fc from 'fast-check';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppModule } from '../../app.module';
import { Usuario } from '../../entities/usuario.entity';

/**
 * Feature: gestion-club-tenis, Propiedad 1: Registro con datos válidos crea usuario con rol No_Socio
 *
 * Validates: Requirements 1.1, 1.3
 *
 * Para cualquier conjunto de datos de registro válidos (nombre, apellido, correo único,
 * contraseña, teléfono), el sistema debe crear el usuario exitosamente y asignarle
 * el rol No_Socio por defecto.
 */

describe('Feature: gestion-club-tenis, Propiedad 1: Registro con datos válidos crea usuario con rol No_Socio', () => {
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
    'registro con datos válidos crea usuario con rol no_socio',
    async () => {
      const createdEmails: string[] = [];

      try {
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              nombre: fc.stringMatching(/^[A-Za-z]{2,30}$/),
              apellido: fc.stringMatching(/^[A-Za-z]{2,30}$/),
              // uuid-based emails guarantee uniqueness across all 100 iterations
              email: fc.uuid().map((id) => `test-${id}@example.com`),
              password: fc.stringMatching(/^[A-Za-z0-9]{8,20}$/),
              telefono: fc.stringMatching(/^\d{7,15}$/),
            }),
            async (userData) => {
              createdEmails.push(userData.email);

              const response = await request(app.getHttpServer())
                .post('/api/auth/register')
                .send(userData);

              // Assert 201 Created
              expect(response.status).toBe(201);

              // Assert rol is no_socio by default
              expect(response.body.rol).toBe('no_socio');

              // Assert password_hash is NOT exposed in the response
              expect(response.body.password_hash).toBeUndefined();
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
