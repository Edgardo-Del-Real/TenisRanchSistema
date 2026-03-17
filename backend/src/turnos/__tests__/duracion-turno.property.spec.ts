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
 * Feature: gestion-club-tenis, Propiedad 17: Duración de turno según tipo de día
 *
 * **Validates: Requirements 6.5**
 *
 * Para cualquier turno reservado, la duración debe ser de 60 minutos si corresponde
 * a un día de semana, y de 90 minutos si corresponde a fin de semana o feriado.
 */

describe('Feature: gestion-club-tenis, Propiedad 17: Duración de turno según tipo de día', () => {
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
    'duración de turno según tipo de día',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            adminEmail: fc.uuid().map((id) => `test-admin-duracion-${id}@example.com`),
            adminPassword: fc.stringMatching(/^[A-Za-z0-9]{8,20}$/),
            userEmail: fc.uuid().map((id) => `test-user-duracion-${id}@example.com`),
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

              // Step 2: Create regular user (as ADMINISTRADOR to bypass anticipación limit)
              const user = usuarioRepository.create({
                nombre: 'User',
                apellido: 'Test',
                email: data.userEmail,
                password_hash: await bcrypt.hash(data.userPassword, 10),
                telefono: '1234567891',
                rol: Rol.ADMINISTRADOR,
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

              // Find next weekday (Monday-Friday)
              const nextWeekday = new Date();
              nextWeekday.setDate(nextWeekday.getDate() + 1);
              while (nextWeekday.getDay() === 0 || nextWeekday.getDay() === 6) {
                nextWeekday.setDate(nextWeekday.getDate() + 1);
              }
              nextWeekday.setHours(10, 0, 0, 0);

              // Test 1: Weekday turno should have 60 minutes duration
              const responseWeekday = await request(app.getHttpServer())
                .post('/api/turnos')
                .set('Authorization', `Bearer ${token}`)
                .send({
                  cancha_id: cancha.id.toLowerCase(),
                  fecha_hora_inicio: nextWeekday.toISOString(),
                });
              expect(responseWeekday.status).toBe(201);
              expect(responseWeekday.body.duracion_minutos).toBe(60);

              // Cleanup turno 1
              await turnoRepository.delete({ id: responseWeekday.body.id });

              // Find next weekend day (Saturday or Sunday)
              const nextWeekend = new Date();
              nextWeekend.setDate(nextWeekend.getDate() + 1);
              while (nextWeekend.getDay() !== 0 && nextWeekend.getDay() !== 6) {
                nextWeekend.setDate(nextWeekend.getDate() + 1);
              }
              nextWeekend.setHours(10, 0, 0, 0);

              // Test 2: Weekend turno should have 90 minutes duration
              const responseWeekend = await request(app.getHttpServer())
                .post('/api/turnos')
                .set('Authorization', `Bearer ${token}`)
                .send({
                  cancha_id: cancha.id.toLowerCase(),
                  fecha_hora_inicio: nextWeekend.toISOString(),
                });
              expect(responseWeekend.status).toBe(201);
              expect(responseWeekend.body.duracion_minutos).toBe(90);
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

