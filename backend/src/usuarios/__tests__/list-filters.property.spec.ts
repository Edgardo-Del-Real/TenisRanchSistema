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
 * Feature: gestion-club-tenis, Propiedad 12: Filtros de listado devuelven solo resultados coincidentes
 *
 * **Validates: Requirements 4.2, 4.3, 4.4**
 *
 * Para cualquier filtro aplicado (búsqueda por nombre/apellido, estado activo/inactivo, o rol),
 * el sistema debe devolver únicamente los usuarios que coincidan con los criterios especificados.
 */

describe('Feature: gestion-club-tenis, Propiedad 12: Filtros de listado devuelven solo resultados coincidentes', () => {
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
    'filtros de listado devuelven solo resultados coincidentes',
    async () => {
      const createdEmails: string[] = [];

      await fc.assert(
        fc.asyncProperty(
          fc.record({
            adminEmail: fc.uuid().map((id) => `test-admin-filter-${id}@example.com`),
            adminPassword: fc.stringMatching(/^[A-Za-z0-9]{8,20}$/),
            // Create 3 test users with distinct characteristics
            user1: fc.record({
              nombre: fc.constant('Carlos'),
              apellido: fc.constant('Martinez'),
              email: fc.uuid().map((id) => `test-user1-filter-${id}@example.com`),
              telefono: fc.stringMatching(/^\d{7,15}$/),
              rol: fc.constant(Rol.SOCIO),
              activo: fc.constant(true),
            }),
            user2: fc.record({
              nombre: fc.constant('Maria'),
              apellido: fc.constant('Garcia'),
              email: fc.uuid().map((id) => `test-user2-filter-${id}@example.com`),
              telefono: fc.stringMatching(/^\d{7,15}$/),
              rol: fc.constant(Rol.NO_SOCIO),
              activo: fc.constant(false),
            }),
            user3: fc.record({
              nombre: fc.constant('Carlos'),
              apellido: fc.constant('Lopez'),
              email: fc.uuid().map((id) => `test-user3-filter-${id}@example.com`),
              telefono: fc.stringMatching(/^\d{7,15}$/),
              rol: fc.constant(Rol.ADMINISTRADOR),
              activo: fc.constant(true),
            }),
          }),
          async (data) => {
            // Track emails for cleanup
            const iterationEmails = [
              data.adminEmail,
              data.user1.email,
              data.user2.email,
              data.user3.email,
            ];
            createdEmails.push(...iterationEmails);

            try {
              // Step 1: Create admin user
              const passwordHash = await bcrypt.hash(data.adminPassword, 10);
              const adminUser = usuarioRepository.create({
                nombre: 'Admin',
                apellido: 'Filter',
                email: data.adminEmail,
                password_hash: passwordHash,
                telefono: '1234567890',
                rol: Rol.ADMINISTRADOR,
                activo: true,
              });
              await usuarioRepository.save(adminUser);

              // Step 2: Create test users directly via repository
              const user1 = usuarioRepository.create({
                ...data.user1,
                password_hash: await bcrypt.hash('password123', 10),
              });
              const user2 = usuarioRepository.create({
                ...data.user2,
                password_hash: await bcrypt.hash('password123', 10),
              });
              const user3 = usuarioRepository.create({
                ...data.user3,
                password_hash: await bcrypt.hash('password123', 10),
              });
              await usuarioRepository.save([user1, user2, user3]);

              // Step 3: Login as admin
              const loginResponse = await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({ email: data.adminEmail, password: data.adminPassword });
              expect(loginResponse.status).toBe(200);
              const adminToken: string = loginResponse.body.access_token;

              // Test 1: Filter by nombre (should return user1 and user3 - both named "Carlos")
              const nombreResponse = await request(app.getHttpServer())
                .get('/api/usuarios')
                .query({ nombre: 'Carlos' })
                .set('Authorization', `Bearer ${adminToken}`);
              expect(nombreResponse.status).toBe(200);
              const nombreResults = nombreResponse.body.filter((u: any) =>
                [data.user1.email, data.user2.email, data.user3.email].includes(u.email),
              );
              expect(nombreResults.length).toBe(2);
              expect(nombreResults.every((u: any) => u.nombre === 'Carlos')).toBe(true);

              // Test 2: Filter by apellido (should return only user2 - "Garcia")
              const apellidoResponse = await request(app.getHttpServer())
                .get('/api/usuarios')
                .query({ apellido: 'Garcia' })
                .set('Authorization', `Bearer ${adminToken}`);
              expect(apellidoResponse.status).toBe(200);
              const apellidoResults = apellidoResponse.body.filter((u: any) =>
                [data.user1.email, data.user2.email, data.user3.email].includes(u.email),
              );
              expect(apellidoResults.length).toBe(1);
              expect(apellidoResults[0].apellido).toBe('Garcia');

              // Test 3: Filter by activo=true (should return user1 and user3)
              const activoTrueResponse = await request(app.getHttpServer())
                .get('/api/usuarios')
                .query({ activo: 'true' })
                .set('Authorization', `Bearer ${adminToken}`);
              expect(activoTrueResponse.status).toBe(200);
              const activoTrueResults = activoTrueResponse.body.filter((u: any) =>
                [data.user1.email, data.user2.email, data.user3.email].includes(u.email),
              );
              expect(activoTrueResults.length).toBe(2);
              expect(activoTrueResults.every((u: any) => u.activo === true)).toBe(true);

              // Test 4: Filter by activo=false (should return only user2)
              const activoFalseResponse = await request(app.getHttpServer())
                .get('/api/usuarios')
                .query({ activo: 'false' })
                .set('Authorization', `Bearer ${adminToken}`);
              expect(activoFalseResponse.status).toBe(200);
              const activoFalseResults = activoFalseResponse.body.filter((u: any) =>
                [data.user1.email, data.user2.email, data.user3.email].includes(u.email),
              );
              expect(activoFalseResults.length).toBe(1);
              expect(activoFalseResults[0].activo).toBe(false);

              // Test 5: Filter by rol=socio (should return only user1)
              const rolSocioResponse = await request(app.getHttpServer())
                .get('/api/usuarios')
                .query({ rol: Rol.SOCIO })
                .set('Authorization', `Bearer ${adminToken}`);
              expect(rolSocioResponse.status).toBe(200);
              const rolSocioResults = rolSocioResponse.body.filter((u: any) =>
                [data.user1.email, data.user2.email, data.user3.email].includes(u.email),
              );
              expect(rolSocioResults.length).toBe(1);
              expect(rolSocioResults[0].rol).toBe(Rol.SOCIO);

              // Test 6: Filter by rol=no_socio (should return only user2)
              const rolNoSocioResponse = await request(app.getHttpServer())
                .get('/api/usuarios')
                .query({ rol: Rol.NO_SOCIO })
                .set('Authorization', `Bearer ${adminToken}`);
              expect(rolNoSocioResponse.status).toBe(200);
              const rolNoSocioResults = rolNoSocioResponse.body.filter((u: any) =>
                [data.user1.email, data.user2.email, data.user3.email].includes(u.email),
              );
              expect(rolNoSocioResults.length).toBe(1);
              expect(rolNoSocioResults[0].rol).toBe(Rol.NO_SOCIO);
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

