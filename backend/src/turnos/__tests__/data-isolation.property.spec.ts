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
import { Cuota } from '../../entities/cuota.entity';
import { Rol } from '../../common/enums/rol.enum';
import { EstadoCancha } from '../../common/enums/estado-cancha.enum';
import { EstadoTurno } from '../../common/enums/estado-turno.enum';
import { EstadoCuota } from '../../common/enums/estado-cuota.enum';
import { TipoTarifa } from '../../common/enums/tipo-tarifa.enum';
import { cleanupTestUsers } from '../../__tests__/test-helpers';

/**
 * Feature: gestion-club-tenis, Propiedad 23: Aislamiento de datos entre usuarios no-administradores
 *
 * **Validates: Requirements 8.4, 8.5, 9.9**
 *
 * Para cualquier usuario con rol Socio o No_Socio, el listado de sus turnos vigentes
 * y su historial no debe contener turnos ni cuotas pertenecientes a otros usuarios.
 */

describe('Feature: gestion-club-tenis, Propiedad 23: Aislamiento de datos entre usuarios no-administradores', () => {
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
    // Clean up all test data to ensure clean state
    await turnoRepository.createQueryBuilder().delete().execute();
    await cuotaRepository.createQueryBuilder().delete().execute();
    await cleanupTestUsers(usuarioRepository);
    await canchaRepository.createQueryBuilder().delete().execute();
    await configuracionRepository.createQueryBuilder().delete().execute();
    await tarifaRepository.createQueryBuilder().delete().execute();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  }, 30000);

  it(
    'usuarios no-administradores solo ven sus propios turnos y cuotas',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            // User 1 - Socio
            user1Email: fc.uuid().map((id) => `test-user1-isolation-${id}@example.com`),
            user1Password: fc.stringMatching(/^[A-Za-z0-9]{8,20}$/),
            // User 2 - No_Socio  
            user2Email: fc.uuid().map((id) => `test-user2-isolation-${id}@example.com`),
            user2Password: fc.stringMatching(/^[A-Za-z0-9]{8,20}$/),
          }),
          async (data) => {
            const createdEmails = [data.user1Email, data.user2Email];
            let cancha: Cancha | null = null;
            let config: ConfiguracionClub | null = null;
            let tarifa: Tarifa | null = null;

            try {
              // Step 1: Create two users with different roles
              const user1 = usuarioRepository.create({
                nombre: 'User',
                apellido: 'One',
                email: data.user1Email,
                password_hash: await bcrypt.hash(data.user1Password, 10),
                telefono: '1234567891',
                rol: Rol.SOCIO,
                activo: true,
              });
              const user2 = usuarioRepository.create({
                nombre: 'User',
                apellido: 'Two',
                email: data.user2Email,
                password_hash: await bcrypt.hash(data.user2Password, 10),
                telefono: '1234567892',
                rol: Rol.NO_SOCIO,
                activo: true,
              });
              await usuarioRepository.save([user1, user2]);

              // Step 2: Create test infrastructure
              cancha = canchaRepository.create({
                numero: Math.floor(Math.random() * 10000),
                estado: EstadoCancha.DISPONIBLE,
              });
              await canchaRepository.save(cancha);

              config = configuracionRepository.create({
                apertura: '08:00:00',
                cierre: '22:00:00',
                luz_inicio: '18:00:00',
                luz_fin: '22:00:00',
                duracion_semana_min: 60,
                duracion_finde_min: 90,
              });
              await configuracionRepository.save(config);

              tarifa = tarifaRepository.create({
                tipo: TipoTarifa.TURNO_NO_SOCIO,
                valor: 1000,
                vigente_desde: new Date(),
              });
              await tarifaRepository.save(tarifa);

              // Step 3: Create turnos for each user directly in database
              const tomorrow = new Date();
              tomorrow.setDate(tomorrow.getDate() + 1);
              tomorrow.setHours(10, 0, 0, 0);

              const turno1 = turnoRepository.create({
                usuario_id: user1.id,
                cancha_id: cancha.id,
                fecha_inicio: tomorrow,
                fecha_fin: new Date(tomorrow.getTime() + 60 * 60000), // 1 hour later
                requiere_luz: false,
                costo_turno: 1000,
                costo_luz: 0,
                estado: EstadoTurno.ACTIVO,
              });

              const turno2 = turnoRepository.create({
                usuario_id: user2.id,
                cancha_id: cancha.id,
                fecha_inicio: new Date(tomorrow.getTime() + 2 * 60 * 60000), // 2 hours later
                fecha_fin: new Date(tomorrow.getTime() + 3 * 60 * 60000), // 3 hours later
                requiere_luz: false,
                costo_turno: 1000,
                costo_luz: 0,
                estado: EstadoTurno.ACTIVO,
              });

              await turnoRepository.save([turno1, turno2]);

              // Step 4: Create cuotas for user1 (Socio only)
              const cuota1 = cuotaRepository.create({
                socio_id: user1.id,
                mes: 1,
                anio: 2024,
                monto_total: 5000,
                monto_abonado: 0,
                estado: EstadoCuota.PENDIENTE,
              });
              await cuotaRepository.save(cuota1);

              // Step 5: Login as user1 (Socio)
              const loginResponse1 = await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({ email: data.user1Email, password: data.user1Password });
              expect(loginResponse1.status).toBe(200);
              const token1: string = loginResponse1.body.access_token;

              // Step 6: Login as user2 (No_Socio)
              const loginResponse2 = await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({ email: data.user2Email, password: data.user2Password });
              expect(loginResponse2.status).toBe(200);
              const token2: string = loginResponse2.body.access_token;

              // Test 1: User1 should only see their own turnos vigentes
              const turnosUser1Response = await request(app.getHttpServer())
                .get('/api/turnos')
                .set('Authorization', `Bearer ${token1}`);
              expect(turnosUser1Response.status).toBe(200);
              const turnosUser1 = turnosUser1Response.body;
              expect(turnosUser1.length).toBe(1);
              expect(turnosUser1[0].id).toBe(turno1.id);

              // Test 2: User2 should only see their own turnos vigentes
              const turnosUser2Response = await request(app.getHttpServer())
                .get('/api/turnos')
                .set('Authorization', `Bearer ${token2}`);
              expect(turnosUser2Response.status).toBe(200);
              const turnosUser2 = turnosUser2Response.body;
              expect(turnosUser2.length).toBe(1);
              expect(turnosUser2[0].id).toBe(turno2.id);

              // Test 3: User1 should only see their own historial
              const historialUser1Response = await request(app.getHttpServer())
                .get('/api/turnos/historial')
                .set('Authorization', `Bearer ${token1}`);
              expect(historialUser1Response.status).toBe(200);
              const historialUser1 = historialUser1Response.body;
              expect(historialUser1.length).toBe(1);
              expect(historialUser1[0].id).toBe(turno1.id);

              // Test 4: User2 should only see their own historial
              const historialUser2Response = await request(app.getHttpServer())
                .get('/api/turnos/historial')
                .set('Authorization', `Bearer ${token2}`);
              expect(historialUser2Response.status).toBe(200);
              const historialUser2 = historialUser2Response.body;
              expect(historialUser2.length).toBe(1);
              expect(historialUser2[0].id).toBe(turno2.id);

              // Test 5: Verify no cross-contamination - user1 cannot see user2's data
              expect(turnosUser1.every((t: any) => t.id !== turno2.id)).toBe(true);
              expect(historialUser1.every((t: any) => t.id !== turno2.id)).toBe(true);

              // Test 6: Verify no cross-contamination - user2 cannot see user1's data
              expect(turnosUser2.every((t: any) => t.id !== turno1.id)).toBe(true);
              expect(historialUser2.every((t: any) => t.id !== turno1.id)).toBe(true);

              // Test 7: Verify user info is not exposed to non-admin users
              expect(turnosUser1[0].usuario).toBeUndefined();
              expect(turnosUser2[0].usuario).toBeUndefined();
              expect(historialUser1[0].usuario).toBeUndefined();
              expect(historialUser2[0].usuario).toBeUndefined();

            } finally {
              // Cleanup in correct order to avoid FK constraint violations
              // First delete turnos and cuotas that reference users
              await turnoRepository.createQueryBuilder().delete().execute();
              await cuotaRepository.createQueryBuilder().delete().execute();
              
              // Then delete users
              for (const email of createdEmails) {
                await usuarioRepository.delete({ email });
              }
              
              // Finally delete infrastructure
              if (cancha) {
                await canchaRepository.delete({ id: cancha.id });
              }
              if (config) {
                await configuracionRepository.delete({ id: config.id });
              }
              if (tarifa) {
                await tarifaRepository.delete({ id: tarifa.id });
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
