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
 * Feature: gestion-club-tenis, Propiedad 16: Cargo de luz según franja horaria
 *
 * **Validates: Requirements 6.2, 6.3, 6.4**
 *
 * Para cualquier turno, si su horario cae dentro de la franja de iluminación configurada,
 * el campo costo_luz debe ser mayor a 0; si cae fuera de esa franja, el costo_luz debe ser 0.
 */

describe('Feature: gestion-club-tenis, Propiedad 16: Cargo de luz según franja horaria', () => {
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
    'cargo de luz según franja horaria',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            adminEmail: fc.uuid().map((id) => `test-admin-luz-${id}@example.com`),
            adminPassword: fc.stringMatching(/^[A-Za-z0-9]{8,20}$/),
            userEmail: fc.uuid().map((id) => `test-user-luz-${id}@example.com`),
            userPassword: fc.stringMatching(/^[A-Za-z0-9]{8,20}$/),
          }),
          async (data) => {
            const createdEmails = [data.adminEmail, data.userEmail];
            let cancha: Cancha | null = null;
            let config: ConfiguracionClub | null = null;
            let tarifaTurno: Tarifa | null = null;
            let tarifaLuz: Tarifa | null = null;

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

              // Step 4: Create configuration (luz_inicio: 18:00, luz_fin: 22:00)
              config = configuracionRepository.create({
                apertura: '08:00:00',
                cierre: '22:00:00',
                luz_inicio: '18:00:00',
                luz_fin: '22:00:00',
                duracion_semana_min: 60,
                duracion_finde_min: 90,
              });
              await configuracionRepository.save(config);

              // Step 5: Create tarifas
              tarifaTurno = tarifaRepository.create({
                tipo: TipoTarifa.TURNO_NO_SOCIO,
                valor: 1000,
                vigente_desde: new Date(),
              });
              tarifaLuz = tarifaRepository.create({
                tipo: TipoTarifa.LUZ,
                valor: 500,
                vigente_desde: new Date(),
              });
              await tarifaRepository.save([tarifaTurno, tarifaLuz]);

              // Step 6: Login as user
              const loginResponse = await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({ email: data.userEmail, password: data.userPassword });
              expect(loginResponse.status).toBe(200);
              const token: string = loginResponse.body.access_token;

              // Test 1: Turno outside luz franja (10:00 AM) - should have costo_luz = 0
              const tomorrow10am = new Date();
              tomorrow10am.setDate(tomorrow10am.getDate() + 1);
              tomorrow10am.setHours(10, 0, 0, 0);

              const response1 = await request(app.getHttpServer())
                .post('/api/turnos')
                .set('Authorization', `Bearer ${token}`)
                .send({
                  cancha_id: cancha.id.toLowerCase(),
                  fecha_hora_inicio: tomorrow10am.toISOString(),
                });
              expect(response1.status).toBe(201);
              expect(response1.body.requiere_luz).toBe(false);
              expect(Number(response1.body.cargo_luz)).toBe(0);

              // Cleanup turno 1
              await turnoRepository.delete({ id: response1.body.id });

              // Test 2: Turno inside luz franja (19:00 PM) - should have costo_luz > 0
              const tomorrow7pm = new Date();
              tomorrow7pm.setDate(tomorrow7pm.getDate() + 1);
              tomorrow7pm.setHours(19, 0, 0, 0);

              const response2 = await request(app.getHttpServer())
                .post('/api/turnos')
                .set('Authorization', `Bearer ${token}`)
                .send({
                  cancha_id: cancha.id.toLowerCase(),
                  fecha_hora_inicio: tomorrow7pm.toISOString(),
                });
              expect(response2.status).toBe(201);
              expect(response2.body.requiere_luz).toBe(true);
              expect(Number(response2.body.cargo_luz)).toBeGreaterThan(0);
            } finally {
              // Cleanup
              if (cancha) {
                await turnoRepository.delete({ cancha_id: cancha.id });
                await canchaRepository.delete({ id: cancha.id });
              }
              if (config) {
                await configuracionRepository.delete({ id: config.id });
              }
              if (tarifaTurno) {
                await tarifaRepository.delete({ id: tarifaTurno.id });
              }
              if (tarifaLuz) {
                await tarifaRepository.delete({ id: tarifaLuz.id });
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

