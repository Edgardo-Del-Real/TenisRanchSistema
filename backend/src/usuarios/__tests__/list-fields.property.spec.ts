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
 * Feature: gestion-club-tenis, Propiedad 13: Listados incluyen todos los campos requeridos
 *
 * **Validates: Requirements 4.1**
 *
 * El listado de usuarios debe incluir todos los campos requeridos (id, nombre, apellido, email,
 * telefono, rol, activo) y NO debe incluir el campo password_hash por seguridad.
 */

describe('Feature: gestion-club-tenis, Propiedad 13: Listados incluyen todos los campos requeridos', () => {
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
    'listados incluyen todos los campos requeridos',
    async () => {
      const createdEmails: string[] = [];

      await fc.assert(
        fc.asyncProperty(
          fc.record({
            adminEmail: fc.uuid().map((id) => `test-admin-fields-${id}@example.com`),
            adminPassword: fc.stringMatching(/^[A-Za-z0-9]{8,20}$/),
            testUser: fc.record({
              nombre: fc.stringMatching(/^[A-Za-z]{3,20}$/),
              apellido: fc.stringMatching(/^[A-Za-z]{3,20}$/),
              email: fc.uuid().map((id) => `test-user-fields-${id}@example.com`),
              telefono: fc.stringMatching(/^\d{7,15}$/),
              rol: fc.constantFrom(Rol.SOCIO, Rol.NO_SOCIO, Rol.ADMINISTRADOR),
              activo: fc.boolean(),
            }),
          }),
          async (data) => {
            // Track emails for cleanup
            const iterationEmails = [data.adminEmail, data.testUser.email];
            createdEmails.push(...iterationEmails);

            try {
              // Step 1: Create admin user
              const passwordHash = await bcrypt.hash(data.adminPassword, 10);
              const adminUser = usuarioRepository.create({
                nombre: 'Admin',
                apellido: 'Fields',
                email: data.adminEmail,
                password_hash: passwordHash,
                telefono: '1234567890',
                rol: Rol.ADMINISTRADOR,
                activo: true,
              });
              await usuarioRepository.save(adminUser);

              // Step 2: Create test user
              const testUser = usuarioRepository.create({
                ...data.testUser,
                password_hash: await bcrypt.hash('password123', 10),
              });
              await usuarioRepository.save(testUser);

              // Step 3: Login as admin
              const loginResponse = await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({ email: data.adminEmail, password: data.adminPassword });
              expect(loginResponse.status).toBe(200);
              const adminToken: string = loginResponse.body.access_token;

              // Step 4: Get user list
              const listResponse = await request(app.getHttpServer())
                .get('/api/usuarios')
                .set('Authorization', `Bearer ${adminToken}`);
              expect(listResponse.status).toBe(200);
              expect(Array.isArray(listResponse.body)).toBe(true);

              // Step 5: Find our test user in the list
              const testUserInList = listResponse.body.find(
                (u: any) => u.email === data.testUser.email,
              );
              expect(testUserInList).toBeDefined();

              // Step 6: Verify all required fields are present
              expect(testUserInList).toHaveProperty('id');
              expect(testUserInList).toHaveProperty('nombre');
              expect(testUserInList).toHaveProperty('apellido');
              expect(testUserInList).toHaveProperty('email');
              expect(testUserInList).toHaveProperty('telefono');
              expect(testUserInList).toHaveProperty('rol');
              expect(testUserInList).toHaveProperty('activo');

              // Step 7: Verify field values match
              expect(testUserInList.nombre).toBe(data.testUser.nombre);
              expect(testUserInList.apellido).toBe(data.testUser.apellido);
              expect(testUserInList.email).toBe(data.testUser.email);
              expect(testUserInList.telefono).toBe(data.testUser.telefono);
              expect(testUserInList.rol).toBe(data.testUser.rol);
              expect(testUserInList.activo).toBe(data.testUser.activo);

              // Step 8: Verify password_hash is NOT included
              expect(testUserInList).not.toHaveProperty('password_hash');
            } finally {
              // Cleanup after each iteration
              for (const email of iterationEmails) {
                await usuarioRepository.delete({ email });
              }
            }
          },
        ),
        { numRuns: 3 },
      );
    },
    120000,
  );
});

