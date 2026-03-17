import * as fc from 'fast-check';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppModule } from '../../app.module';
import { Usuario } from '../../entities/usuario.entity';

/**
 * Feature: gestion-club-tenis, Propiedad 3: Campos obligatorios vacíos rechazan el registro
 *
 * Validates: Requirement 1.4
 *
 * Para cualquier combinación de campos obligatorios faltantes o vacíos en el
 * formulario de registro, el sistema debe rechazar la solicitud sin crear ningún usuario.
 */

/** All required field names */
const REQUIRED_FIELDS = ['nombre', 'apellido', 'email', 'password', 'telefono'] as const;
type RequiredField = (typeof REQUIRED_FIELDS)[number];

/** A fully valid base payload — generators keep it structurally valid so that
 *  only the deliberately broken fields cause the rejection. */
const validBase = fc.record({
  nombre: fc.stringMatching(/^[A-Za-z]{2,30}$/),
  apellido: fc.stringMatching(/^[A-Za-z]{2,30}$/),
  email: fc.uuid().map((id) => `test-rf-${id}@example.com`),
  password: fc.stringMatching(/^[A-Za-z0-9]{8,20}$/),
  telefono: fc.stringMatching(/^\d{7,15}$/),
});

/**
 * Strategies that produce an invalid payload from a valid base:
 *
 * 1. Omit one or more required fields entirely
 * 2. Set one or more required fields to an empty string
 * 3. Use an invalid email format
 * 4. Use a password shorter than 8 characters
 */
const invalidPayload = (base: Record<RequiredField, string>): fc.Arbitrary<object> =>
  fc.oneof(
    // Strategy 1 — omit at least one required field
    fc
      .subarray(REQUIRED_FIELDS as unknown as RequiredField[], { minLength: 1 })
      .map((fieldsToOmit) => {
        const payload = { ...base };
        for (const field of fieldsToOmit) {
          delete (payload as Record<string, unknown>)[field];
        }
        return payload;
      }),

    // Strategy 2 — set at least one required field to empty string
    fc
      .subarray(REQUIRED_FIELDS as unknown as RequiredField[], { minLength: 1 })
      .map((fieldsToEmpty) => {
        const payload: Record<string, unknown> = { ...base };
        for (const field of fieldsToEmpty) {
          payload[field] = '';
        }
        return payload;
      }),

    // Strategy 3 — invalid email format (not a valid email address)
    fc
      .stringMatching(/^[A-Za-z0-9]{1,20}$/) // plain string without @
      .map((badEmail) => ({ ...base, email: badEmail })),

    // Strategy 4 — password shorter than 8 characters (1–7 chars)
    fc
      .stringMatching(/^[A-Za-z0-9]{1,7}$/)
      .map((shortPassword) => ({ ...base, password: shortPassword })),
  );

describe('Feature: gestion-club-tenis, Propiedad 3: Campos obligatorios vacíos rechazan el registro', () => {
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
    'campos obligatorios faltantes o inválidos rechazan el registro sin crear usuario',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          validBase.chain((base) =>
            invalidPayload(base).map((payload) => ({ base, payload })),
          ),
          async ({ base, payload }) => {
            const response = await request(app.getHttpServer())
              .post('/api/auth/register')
              .send(payload);

            // Assert 400 Bad Request — validation must reject the request
            expect(response.status).toBe(400);

            // Assert no user was created for the base email (if email was kept)
            const emailInPayload = (payload as Record<string, unknown>)['email'];
            if (typeof emailInPayload === 'string' && emailInPayload.length > 0) {
              const count = await usuarioRepository.count({
                where: { email: emailInPayload },
              });
              expect(count).toBe(0);
            }
          },
        ),
        { numRuns: 3 },
      );
    },
    120000, // 2 minutes: 100 iterations × HTTP round-trips
  );
});
