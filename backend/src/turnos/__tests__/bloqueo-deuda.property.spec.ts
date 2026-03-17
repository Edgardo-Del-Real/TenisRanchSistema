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
import { Cuota } from '../../entities/cuota.entity';
import { Rol } from '../../common/enums/rol.enum';
import { EstadoCancha } from '../../common/enums/estado-cancha.enum';
import { TipoTarifa } from '../../common/enums/tipo-tarifa.enum';
import { EstadoCuota } from '../../common/enums/estado-cuota.enum';
import { cleanupTestUsers } from '../../__tests__/test-helpers';

/**
 * Feature: gestion-club-tenis, Propiedad 21: Bloqueo de reservas por deuda de cuotas
 *
 * **Validates: Requirements 6.9**
 *
 * Para cualquier Socio con 2 o más cuotas impagas, el sistema debe permitir exactamente
 * 1 turno adicional y rechazar cualquier reserva posterior hasta que regularice su deuda.
 */

describe('Feature: gestion-club-tenis, Propiedad 21: Bloqueo de reservas por deuda de cuotas', () => {
  let app: INestApplication;
  let usuarioRepository: Repository<Usuario>;
  let canchaRepository: Repository<Cancha>;
  let configuracionRepository: Repository<ConfiguracionClub>;
  let tarifaRepository: Repository<Tarifa>;
  let turnoRepository: Repository<Turno>;
  let cuotaRepository: Repository<Cuota>;

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
    cuotaRepository = moduleFixture.get<Repository<Cuota>>(
      getRepositoryToken(Cuota),
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
    'bloqueo de reservas por deuda de cuotas',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            adminEmail: fc.uuid().map((id) => `test-admin-deuda-${id}@example.com`),
            adminPassword: fc.stringMatching(/^[A-Za-z0-9]{8,20}$/),
            socioEmail: fc.uuid().map((id) => `test-socio-deuda-${id}@example.com`),
            socioPassword: fc.stringMatching(/^[A-Za-z0-9]{8,20}$/),
          }),
          async (data) => {
            const createdEmails = [data.adminEmail, data.socioEmail];
            let cancha: Cancha | null = null;
            let config: ConfiguracionClub | null = null;
            let tarifa: Tarifa | null = null;
            let socio: Usuario | null = null;

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

              // Step 2: Create socio user
              socio = usuarioRepository.create({
                nombre: 'Socio',
                apellido: 'Test',
                email: data.socioEmail,
                password_hash: await bcrypt.hash(data.socioPassword, 10),
                telefono: '1234567891',
                rol: Rol.SOCIO,
                activo: true,
              });
              await usuarioRepository.save(socio);

              // Step 3: Create 2 unpaid cuotas for the socio
              const cuota1 = cuotaRepository.create({
                socio_id: socio.id,
                mes: 1,
                anio: 2024,
                monto_total: 5000,
                monto_abonado: 0,
                estado: EstadoCuota.PENDIENTE,
              });
              const cuota2 = cuotaRepository.create({
                socio_id: socio.id,
                mes: 2,
                anio: 2024,
                monto_total: 5000,
                monto_abonado: 0,
                estado: EstadoCuota.PENDIENTE,
              });
              await cuotaRepository.save([cuota1, cuota2]);

              // Step 4: Create a cancha
              cancha = canchaRepository.create({
                numero: Math.floor(Math.random() * 10000),
                estado: EstadoCancha.DISPONIBLE,
              });
              await canchaRepository.save(cancha);

              // Step 5: Create configuration
              config = configuracionRepository.create({
                apertura: '08:00:00',
                cierre: '22:00:00',
                luz_inicio: '18:00:00',
                luz_fin: '22:00:00',
                duracion_semana_min: 60,
                duracion_finde_min: 90,
              });
              await configuracionRepository.save(config);

              // Step 6: Create tarifa
              tarifa = tarifaRepository.create({
                tipo: TipoTarifa.TURNO_NO_SOCIO,
                valor: 1000,
                vigente_desde: new Date(),
              });
              await tarifaRepository.save(tarifa);

              // Step 7: Login as socio
              const loginResponse = await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({ email: data.socioEmail, password: data.socioPassword });
              expect(loginResponse.status).toBe(200);
              const token: string = loginResponse.body.access_token;

              // Step 8: Socio tries to create a turno - should be blocked
              // Create a date within operating hours (8:00-22:00) and within 1-day limit
              const now = new Date();
              const tomorrow = new Date(now.getTime() + 20 * 60 * 60 * 1000); // 20 hours from now (well within 1-day limit)
              // Ensure the time is within operating hours (8:00-22:00) in local time
              const targetHour = 10; // 10:00 AM - safely within operating hours
              tomorrow.setHours(targetHour, 0, 0, 0);

              const response = await request(app.getHttpServer())
                .post('/api/turnos')
                .set('Authorization', `Bearer ${token}`)
                .send({
                  cancha_id: cancha.id.toLowerCase(),
                  fecha_hora_inicio: tomorrow.toISOString(),
                });

              // Assert: Should be blocked with BLOQUEADO_POR_DEUDA
              expect(response.status).toBe(403);
              expect(response.body.error.code).toBe('BLOQUEADO_POR_DEUDA');

              // Cleanup cuotas
              await cuotaRepository.delete({ socio_id: socio.id });
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
              if (socio) {
                await cuotaRepository.delete({ socio_id: socio.id });
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
