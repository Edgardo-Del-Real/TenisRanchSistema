import * as fc from 'fast-check';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
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
 * Feature: gestion-club-tenis, Propiedad 15: Conflicto de horario rechaza la reserva
 *
 * **Validates: Requirements 6.1**
 *
 * Para cualquier par de turnos que se solapen en la misma cancha y horario,
 * el segundo intento de reserva debe ser rechazado.
 */

describe('Feature: gestion-club-tenis, Propiedad 15: Conflicto de horario rechaza la reserva', () => {
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
    'conflicto de horario rechaza la reserva',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            adminEmail: fc.uuid().map((id) => `test-admin-conflicto-${id}@example.com`),
            adminPassword: fc.stringMatching(/^[A-Za-z0-9]{8,20}$/),
            user1Email: fc.uuid().map((id) => `test-user1-conflicto-${id}@example.com`),
            user2Email: fc.uuid().map((id) => `test-user2-conflicto-${id}@example.com`),
            userPassword: fc.stringMatching(/^[A-Za-z0-9]{8,20}$/),
          }),
          async (data) => {
            const createdEmails = [data.adminEmail, data.user1Email, data.user2Email];
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

              // Step 2: Create two regular users (as ADMINISTRADOR to bypass anticipación limit)
              const user1 = usuarioRepository.create({
                nombre: 'User',
                apellido: 'One',
                email: data.user1Email,
                password_hash: await bcrypt.hash(data.userPassword, 10),
                telefono: '1234567891',
                rol: Rol.ADMINISTRADOR,
                activo: true,
              });
              const user2 = usuarioRepository.create({
                nombre: 'User',
                apellido: 'Two',
                email: data.user2Email,
                password_hash: await bcrypt.hash(data.userPassword, 10),
                telefono: '1234567892',
                rol: Rol.ADMINISTRADOR,
                activo: true,
              });
              await usuarioRepository.save([user1, user2]);

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

              // Step 6: Login as user1
              const loginResponse1 = await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({ email: data.user1Email, password: data.userPassword });
              expect(loginResponse1.status).toBe(200);
              const token1: string = loginResponse1.body.access_token;

              // Step 7: User1 creates a turno (tomorrow at 10:00)
              const tomorrow = new Date();
              tomorrow.setDate(tomorrow.getDate() + 1);
              tomorrow.setHours(10, 0, 0, 0);

              const createResponse1 = await request(app.getHttpServer())
                .post('/api/turnos')
                .set('Authorization', `Bearer ${token1}`)
                .send({
                  cancha_id: cancha.id.toLowerCase(),
                  fecha_hora_inicio: tomorrow.toISOString(),
                });
              expect(createResponse1.status).toBe(201);

              // Step 8: Login as user2
              const loginResponse2 = await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({ email: data.user2Email, password: data.userPassword });
              expect(loginResponse2.status).toBe(200);
              const token2: string = loginResponse2.body.access_token;

              // Step 9: User2 tries to create a turno at the same time (should fail)
              const createResponse2 = await request(app.getHttpServer())
                .post('/api/turnos')
                .set('Authorization', `Bearer ${token2}`)
                .send({
                  cancha_id: cancha.id.toLowerCase(),
                  fecha_hora_inicio: tomorrow.toISOString(),
                });

              // Assert: Second reservation should be rejected with CONFLICTO_HORARIO
              expect(createResponse2.status).toBe(400);
              expect(createResponse2.body.error.code).toBe('CONFLICTO_HORARIO');
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

