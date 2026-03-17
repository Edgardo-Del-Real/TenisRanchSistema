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
 * Feature: gestion-club-tenis, Propiedad 27: Snapshot de tarifa al momento de la reserva
 *
 * **Validates: Requirements 10.7**
 *
 * Para cualquier turno reservado, el costo registrado debe corresponder a la tarifa vigente
 * en el momento exacto de la reserva, independientemente de cambios de tarifa posteriores.
 */

describe('Feature: gestion-club-tenis, Propiedad 27: Snapshot de tarifa al momento de la reserva', () => {
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
    'snapshot de tarifa al momento de la reserva',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            adminEmail: fc.uuid().map((id) => `test-admin-snapshot-${id}@example.com`),
            adminPassword: fc.stringMatching(/^[A-Za-z0-9]{8,20}$/),
            userEmail: fc.uuid().map((id) => `test-user-snapshot-${id}@example.com`),
            userPassword: fc.stringMatching(/^[A-Za-z0-9]{8,20}$/),
            initialPrice: fc.integer({ min: 500, max: 2000 }),
            newPrice: fc.integer({ min: 2001, max: 5000 }),
          }),
          async (data) => {
            const createdEmails = [data.adminEmail, data.userEmail];
            let cancha: Cancha | null = null;
            let config: ConfiguracionClub | null = null;
            let tarifa1: Tarifa | null = null;
            let tarifa2: Tarifa | null = null;

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

              // Step 5: Create initial tarifa
              tarifa1 = tarifaRepository.create({
                tipo: TipoTarifa.TURNO_NO_SOCIO,
                valor: data.initialPrice,
                vigente_desde: new Date(Date.now() - 1000), // 1 second ago
              });
              await tarifaRepository.save(tarifa1);

              // Step 6: Login as user
              const loginResponse = await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({ email: data.userEmail, password: data.userPassword });
              expect(loginResponse.status).toBe(200);
              const token: string = loginResponse.body.access_token;

              // Step 7: Create first turno with initial price
              const tomorrow10am = new Date();
              tomorrow10am.setDate(tomorrow10am.getDate() + 1);
              tomorrow10am.setHours(10, 0, 0, 0);

              const response1 = await request(app.getHttpServer())
                .post('/api/turnos')
                .set('Authorization', `Bearer ${token}`)
                .send({
                  cancha_id: cancha.id,
                  fecha_hora_inicio: tomorrow10am.toISOString(),
                });
              expect(response1.status).toBe(201);
              const turno1CostoTurno = Number(response1.body.costo_turno);
              expect(turno1CostoTurno).toBe(data.initialPrice);

              // Step 8: Update tarifa to new price
              tarifa2 = tarifaRepository.create({
                tipo: TipoTarifa.TURNO_NO_SOCIO,
                valor: data.newPrice,
                vigente_desde: new Date(),
              });
              await tarifaRepository.save(tarifa2);

              // Step 9: Create second turno with new price (different time)
              const tomorrow12pm = new Date();
              tomorrow12pm.setDate(tomorrow12pm.getDate() + 1);
              tomorrow12pm.setHours(12, 0, 0, 0);

              const response2 = await request(app.getHttpServer())
                .post('/api/turnos')
                .set('Authorization', `Bearer ${token}`)
                .send({
                  cancha_id: cancha.id,
                  fecha_hora_inicio: tomorrow12pm.toISOString(),
                });
              expect(response2.status).toBe(201);
              const turno2CostoTurno = Number(response2.body.costo_turno);
              expect(turno2CostoTurno).toBe(data.newPrice);

              // Step 10: Verify first turno still has the old price (snapshot)
              const turno1FromDb = await turnoRepository.findOne({
                where: { id: response1.body.id },
              });
              expect(turno1FromDb).toBeDefined();
              expect(Number(turno1FromDb!.costo_turno)).toBe(data.initialPrice);

              // Step 11: Verify second turno has the new price
              const turno2FromDb = await turnoRepository.findOne({
                where: { id: response2.body.id },
              });
              expect(turno2FromDb).toBeDefined();
              expect(Number(turno2FromDb!.costo_turno)).toBe(data.newPrice);
            } finally {
              // Cleanup
              if (cancha) {
                await turnoRepository.delete({ cancha_id: cancha.id });
                await canchaRepository.delete({ id: cancha.id });
              }
              if (config) {
                await configuracionRepository.delete({ id: config.id });
              }
              if (tarifa1) {
                await tarifaRepository.delete({ id: tarifa1.id });
              }
              if (tarifa2) {
                await tarifaRepository.delete({ id: tarifa2.id });
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

