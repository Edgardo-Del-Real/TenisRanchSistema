import * as fc from 'fast-check';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../../app.module';
import { Usuario } from '../../entities/usuario.entity';
import { Cancha } from '../../entities/cancha.entity';
import { ConfiguracionClub } from '../../entities/configuracion-club.entity';
import { Tarifa } from '../../entities/tarifa.entity';
import { Turno } from '../../entities/turno.entity';
import { Rol } from '../../common/enums/rol.enum';
import { EstadoCancha } from '../../common/enums/estado-cancha.enum';
import { TipoTarifa } from '../../common/enums/tipo-tarifa.enum';
import { cleanupTestUsers } from '../../__tests__/test-helpers';

/**
 * Feature: gestion-club-tenis, Propiedad 20: Restricción de anticipación máxima de reserva
 *
 * **Validates: Requirements 6.8**
 *
 * Para cualquier intento de reserva con fecha de inicio a más de 1 día de anticipación
 * desde el momento actual, el sistema debe rechazar la solicitud.
 */

describe('Feature: gestion-club-tenis, Propiedad 20: Restricción de anticipación máxima de reserva', () => {
  let app: INestApplication;
  let usuarioRepository: Repository<Usuario>;
  let canchaRepository: Repository<Cancha>;
  let configuracionRepository: Repository<ConfiguracionClub>;
  let tarifaRepository: Repository<Tarifa>;
  let turnoRepository: Repository<Turno>;

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
    canchaRepository = moduleFixture.get<Repository<Cancha>>(
      getRepositoryToken(Cancha),
    );
    configuracionRepository = moduleFixture.get<Repository<ConfiguracionClub>>(
      getRepositoryToken(ConfiguracionClub),
    );
    tarifaRepository = moduleFixture.get<Repository<Tarifa>>(
      getRepositoryToken(Tarifa),
    );
    turnoRepository = moduleFixture.get<Repository<Turno>>(
      getRepositoryToken(Turno),
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
    'restricción de anticipación máxima de reserva',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            adminEmail: fc.uuid().map((id) => `test-admin-anticip-${id}@example.com`),
            adminPassword: fc.stringMatching(/^[A-Za-z0-9]{8,20}$/),
            userEmail: fc.uuid().map((id) => `test-user-anticip-${id}@example.com`),
            userPassword: fc.stringMatching(/^[A-Za-z0-9]{8,20}$/),
          }),
          async (data) => {
            const createdEmails = [data.adminEmail, data.userEmail];
            let cancha: Cancha | null = null;
            let config: ConfiguracionClub | null = null;
            let tarifa: Tarifa | null = null;

            try {
              // Step 1: Create admin user
              const passwordHash = await bcrypt.hash(data.adminPassword, 10);
              const adminUser = usuarioRepository.create({
                nombre: 'Admin',
                apellido: 'Test',
                email: data.adminEmail,
                password_hash: passwordHash,
                telefono: '1234567890',
                rol: Rol.ADMINISTRADOR,
                activo: true,
              });
              await usuarioRepository.save(adminUser);

              // Step 2: Create regular user (NO_SOCIO)
              const user = usuarioRepository.create({
                nombre: 'User',
                apellido: 'Test',
                email: data.userEmail,
                password_hash: await bcrypt.hash(data.userPassword, 10),
                telefono: '1234567891',
                rol: Rol.NO_SOCIO,
                activo: true,
              });
              await usuarioRepository.save(user);

              // Step 3: Create a cancha
              cancha = canchaRepository.create({
                numero: Math.floor(Math.random() * 10000),
                estado: EstadoCancha.DISPONIBLE,
              });
              await canchaRepository.save(cancha);

              // Step 4: Create configuration
              config = configuracionRepository.create({
                apertura: '08:00:00',
                cierre: '22:00:00',
                luz_inicio: '18:00:00',
                luz_fin: '22:00:00',
                duracion_semana_min: 60,
                duracion_finde_min: 90,
              });
              await configuracionRepository.save(config);

              // Step 5: Create tarifa
              tarifa = tarifaRepository.create({
                tipo: TipoTarifa.TURNO_NO_SOCIO,
                valor: 1000,
                vigente_desde: new Date(),
              });
              await tarifaRepository.save(tarifa);

              // Step 6: Login as user
              const loginResponse = await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({ email: data.userEmail, password: data.userPassword });
              expect(loginResponse.status).toBe(200);
              const token: string = loginResponse.body.access_token;

              // Test 1: Turno more than 1 day in advance (2 days) - should be rejected
              const twoDaysAhead = new Date();
              twoDaysAhead.setDate(twoDaysAhead.getDate() + 2);
              // Ensure the time is within operating hours (8:00-22:00) in local time
              twoDaysAhead.setHours(10, 0, 0, 0);

              const responseTooFar = await request(app.getHttpServer())
                .post('/api/turnos')
                .set('Authorization', `Bearer ${token}`)
                .send({
                  cancha_id: cancha.id.toLowerCase(),
                  fecha_hora_inicio: twoDaysAhead.toISOString(),
                });
              expect(responseTooFar.status).toBe(400);
              expect(responseTooFar.body.error.code).toBe('ANTICIPACION_MAXIMA');

              // Test 2: Turno within 1 day (tomorrow) - should succeed
              // Create a date within operating hours (8:00-22:00) and within 1-day limit
              const now = new Date();
              // Calculate a time that's definitely within 24 hours and within operating hours
              const tomorrow = new Date(now.getTime() + 20 * 60 * 60 * 1000); // 20 hours from now
              // Don't use setHours as it can push us over 24 hours - instead ensure we're in operating hours
              if (tomorrow.getHours() < 8) {
                tomorrow.setHours(8, 0, 0, 0);
              } else if (tomorrow.getHours() >= 22) {
                tomorrow.setHours(21, 0, 0, 0);
              }

              const responseValid = await request(app.getHttpServer())
                .post('/api/turnos')
                .set('Authorization', `Bearer ${token}`)
                .send({
                  cancha_id: cancha.id.toLowerCase(),
                  fecha_hora_inicio: tomorrow.toISOString(),
                });
              
              expect(responseValid.status).toBe(201);

              // Cleanup turno
              await turnoRepository.delete({ id: responseValid.body.id });

              // Test 3: Admin should be able to book more than 1 day in advance
              const loginAdmin = await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({ email: data.adminEmail, password: data.adminPassword });
              expect(loginAdmin.status).toBe(200);
              const adminToken: string = loginAdmin.body.access_token;

              const responseAdmin = await request(app.getHttpServer())
                .post('/api/turnos')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                  cancha_id: cancha.id.toLowerCase(),
                  fecha_hora_inicio: twoDaysAhead.toISOString(),
                });
              expect(responseAdmin.status).toBe(201);
            } finally {
              // Cleanup
              if (cancha) {
                await turnoRepository.delete({ cancha_id: cancha.id });
                await canchaRepository.delete({ id: cancha.id });
              }
              if (config) {
                await configuracionRepository.delete({ id: config.id });
              }
              if (tarifa) {
                await tarifaRepository.delete({ id: tarifa.id });
              }
              for (const email of createdEmails) {
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
