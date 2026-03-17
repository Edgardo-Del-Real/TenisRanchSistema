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
 * Feature: gestion-club-tenis, Propiedad 19: Límite diario de turnos por usuario no-administrador
 *
 * **Validates: Requirements 6.7, 6.11**
 *
 * Para cualquier usuario con rol Socio o No_Socio que ya tenga 2 turnos reservados en un día,
 * cualquier intento de reservar un tercer turno en ese mismo día debe ser rechazado.
 * Los Administradores no tienen esta restricción.
 */

describe('Feature: gestion-club-tenis, Propiedad 19: Límite diario de turnos por usuario no-administrador', () => {
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
    'límite diario de turnos por usuario no-administrador',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            adminEmail: fc.uuid().map((id) => `test-admin-limite-${id}@example.com`),
            adminPassword: fc.stringMatching(/^[A-Za-z0-9]{8,20}$/),
            userEmail: fc.uuid().map((id) => `test-user-limite-${id}@example.com`),
            userPassword: fc.stringMatching(/^[A-Za-z0-9]{8,20}$/),
          }),
          async (data) => {
            const createdEmails = [data.adminEmail, data.userEmail];
            let cancha1: Cancha | null = null;
            let cancha2: Cancha | null = null;
            let cancha3: Cancha | null = null;
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

              // Step 3: Create 3 canchas
              cancha1 = canchaRepository.create({
                numero: Math.floor(Math.random() * 10000),
                estado: EstadoCancha.DISPONIBLE,
              });
              cancha2 = canchaRepository.create({
                numero: Math.floor(Math.random() * 10000) + 10000,
                estado: EstadoCancha.DISPONIBLE,
              });
              cancha3 = canchaRepository.create({
                numero: Math.floor(Math.random() * 10000) + 20000,
                estado: EstadoCancha.DISPONIBLE,
              });
              await canchaRepository.save([cancha1, cancha2, cancha3]);

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

              // Step 7: Create first turno (10:00 AM tomorrow)
              // Create dates within operating hours (8:00-22:00) and within 1-day limit
              const now = new Date();
              const baseTime = new Date(now.getTime() + 18 * 60 * 60 * 1000); // 18 hours from now (well within 1-day limit)
              
              // First turno
              const tomorrow10am = new Date(baseTime);
              // Don't use setHours as it can push us over 24 hours - instead ensure we're in operating hours
              if (tomorrow10am.getHours() < 8) {
                tomorrow10am.setHours(8, 0, 0, 0);
              } else if (tomorrow10am.getHours() >= 22) {
                tomorrow10am.setHours(21, 0, 0, 0);
              }

              const response1 = await request(app.getHttpServer())
                .post('/api/turnos')
                .set('Authorization', `Bearer ${token}`)
                .send({
                  cancha_id: cancha1.id,
                  fecha_hora_inicio: tomorrow10am.toISOString(),
                });
              expect(response1.status).toBe(201);

              // Step 8: Create second turno (2 hours later, but ensure it's still within 24 hours from now)
              const tomorrow12pm = new Date(tomorrow10am.getTime() + 2 * 60 * 60 * 1000); // 2 hours after first turno
              // Ensure we're still in operating hours and within 24 hours from now
              if (tomorrow12pm.getHours() >= 22) {
                tomorrow12pm.setHours(21, 0, 0, 0);
              }
              
              // Double check we're within 24 hours from now
              const diffFromNow = (tomorrow12pm.getTime() - now.getTime()) / (1000 * 60 * 60);
              if (diffFromNow > 24) {
                // Adjust to be within 24 hours
                const adjustedTime = new Date(now.getTime() + 23 * 60 * 60 * 1000); // 23 hours from now
                tomorrow12pm.setTime(adjustedTime.getTime());
                if (tomorrow12pm.getHours() < 8) {
                  tomorrow12pm.setHours(8, 0, 0, 0);
                } else if (tomorrow12pm.getHours() >= 22) {
                  tomorrow12pm.setHours(21, 0, 0, 0);
                }
              }

              const response2 = await request(app.getHttpServer())
                .post('/api/turnos')
                .set('Authorization', `Bearer ${token}`)
                .send({
                  cancha_id: cancha2.id,
                  fecha_hora_inicio: tomorrow12pm.toISOString(),
                });
              
              expect(response2.status).toBe(201);

              // Step 9: Try to create third turno (should fail with LIMITE_DIARIO)
              const tomorrow2pm = new Date(tomorrow10am.getTime() + 4 * 60 * 60 * 1000); // 4 hours after first turno
              // Ensure we're still in operating hours and within 24 hours from now
              if (tomorrow2pm.getHours() >= 22) {
                tomorrow2pm.setHours(21, 0, 0, 0);
              }
              
              // Double check we're within 24 hours from now
              const diffFromNow3 = (tomorrow2pm.getTime() - now.getTime()) / (1000 * 60 * 60);
              if (diffFromNow3 > 24) {
                // Adjust to be within 24 hours
                const adjustedTime3 = new Date(now.getTime() + 22 * 60 * 60 * 1000); // 22 hours from now
                tomorrow2pm.setTime(adjustedTime3.getTime());
                if (tomorrow2pm.getHours() < 8) {
                  tomorrow2pm.setHours(8, 0, 0, 0);
                } else if (tomorrow2pm.getHours() >= 22) {
                  tomorrow2pm.setHours(21, 0, 0, 0);
                }
              }

              const response3 = await request(app.getHttpServer())
                .post('/api/turnos')
                .set('Authorization', `Bearer ${token}`)
                .send({
                  cancha_id: cancha3.id,
                  fecha_hora_inicio: tomorrow2pm.toISOString(),
                });
              expect(response3.status).toBe(400);
              expect(response3.body.error.code).toBe('LIMITE_DIARIO');
            } finally {
              // Cleanup
              if (cancha1) {
                await turnoRepository.delete({ cancha_id: cancha1.id });
                await canchaRepository.delete({ id: cancha1.id });
              }
              if (cancha2) {
                await turnoRepository.delete({ cancha_id: cancha2.id });
                await canchaRepository.delete({ id: cancha2.id });
              }
              if (cancha3) {
                await turnoRepository.delete({ cancha_id: cancha3.id });
                await canchaRepository.delete({ id: cancha3.id });
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
