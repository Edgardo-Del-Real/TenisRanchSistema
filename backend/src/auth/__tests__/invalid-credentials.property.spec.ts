import * as fc from 'fast-check';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppModule } from '../../app.module';
import { Usuario } from '../../entities/usuario.entity';

/**
 * Feature: gestion-club-tenis, Propiedad 5: Credenciales inválidas rechazan el acceso
 *
 * Validates: Requirements 2.2, 3.7
 *
 * Para cualquier combinación de credenciales incorrectas (correo inexistente,
 * contraseña incorrecta, o usuario inactivo), el sistema debe rechazar el acceso
 * con un mensaje genérico sin revelar cuál campo es incorrecto.
 */

describe('Feature: gestion-club-tenis, Propiedad 5: Credenciales inválidas rechazan el acceso', () => {
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
    'credenciales inválidas rechazan el acceso con mensaje genérico',
    async () => {
      const createdEmails: string[] = [];

      // Scenario type discriminant
      type Scenario =
        | { kind: 'nonexistent'; email: string; password: string }
        | { kind: 'wrong-password'; email: string; password: string; wrongPassword: string }
        | { kind: 'inactive'; email: string; password: string };

      const scenarioArb: fc.Arbitrary<Scenario> = fc.oneof(
        // Scenario A: non-existent email (uuid-based, never registered)
        fc.record({
          kind: fc.constant('nonexistent' as const),
          email: fc.uuid().map((id) => `ghost-${id}@example.com`),
          password: fc.stringMatching(/^[A-Za-z0-9]{8,20}$/),
        }),
        // Scenario B: registered user but wrong password
        fc.record({
          kind: fc.constant('wrong-password' as const),
          email: fc.uuid().map((id) => `user-${id}@example.com`),
          password: fc.stringMatching(/^[A-Za-z0-9]{8,20}$/),
          wrongPassword: fc.stringMatching(/^[A-Za-z0-9]{8,20}$/).filter(
            (p) => p !== undefined,
          ),
        }),
        // Scenario C: registered user but inactive (activo=false)
        fc.record({
          kind: fc.constant('inactive' as const),
          email: fc.uuid().map((id) => `inactive-${id}@example.com`),
          password: fc.stringMatching(/^[A-Za-z0-9]{8,20}$/),
        }),
      );

      const collectedMessages: string[] = [];

      try {
        await fc.assert(
          fc.asyncProperty(scenarioArb, async (scenario) => {
            let loginEmail: string;
            let loginPassword: string;

            if (scenario.kind === 'nonexistent') {
              // No registration needed — email was never registered
              loginEmail = scenario.email;
              loginPassword = scenario.password;
            } else if (scenario.kind === 'wrong-password') {
              // Register the user first
              createdEmails.push(scenario.email);
              const registerRes = await request(app.getHttpServer())
                .post('/api/auth/register')
                .send({
                  nombre: 'Test',
                  apellido: 'User',
                  email: scenario.email,
                  password: scenario.password,
                  telefono: '1234567890',
                });
              expect(registerRes.status).toBe(201);

              loginEmail = scenario.email;
              // Use a different password — ensure it differs from the correct one
              loginPassword =
                scenario.wrongPassword !== scenario.password
                  ? scenario.wrongPassword
                  : scenario.wrongPassword + 'X';
            } else {
              // scenario.kind === 'inactive'
              // Register the user, then mark as inactive via repository
              createdEmails.push(scenario.email);
              const registerRes = await request(app.getHttpServer())
                .post('/api/auth/register')
                .send({
                  nombre: 'Test',
                  apellido: 'Inactive',
                  email: scenario.email,
                  password: scenario.password,
                  telefono: '1234567890',
                });
              expect(registerRes.status).toBe(201);

              // Deactivate the user directly via repository
              await usuarioRepository.update(
                { email: scenario.email },
                { activo: false },
              );

              loginEmail = scenario.email;
              loginPassword = scenario.password;
            }

            // Attempt login with invalid credentials
            const loginRes = await request(app.getHttpServer())
              .post('/api/auth/login')
              .send({ email: loginEmail, password: loginPassword });

            // Assert 401 Unauthorized
            expect(loginRes.status).toBe(401);

            // Assert error code is the generic CREDENCIALES_INVALIDAS
            expect(loginRes.body.error?.code).toBe('CREDENCIALES_INVALIDAS');

            // Collect the message to verify uniformity across scenarios
            const message: string = loginRes.body.error?.message;
            expect(typeof message).toBe('string');
            expect(message.length).toBeGreaterThan(0);
            collectedMessages.push(message);
          }),
          { numRuns: 3 },
        );

        // After all iterations: verify the same message was returned for every scenario
        // (no field-specific hints leaked)
        const uniqueMessages = new Set(collectedMessages);
        expect(uniqueMessages.size).toBe(1);
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
