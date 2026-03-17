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
import { Turno } from '../../entities/turno.entity';
import { PagoTurno } from '../../entities/pago-turno.entity';
import { PagoLuz } from '../../entities/pago-luz.entity';
import { ConfiguracionClub } from '../../entities/configuracion-club.entity';
import { Tarifa } from '../../entities/tarifa.entity';
import { Rol } from '../../common/enums/rol.enum';
import { EstadoCancha } from '../../common/enums/estado-cancha.enum';
import { EstadoTurno } from '../../common/enums/estado-turno.enum';
import { TipoTarifa } from '../../common/enums/tipo-tarifa.enum';
import { cleanupTestUsers } from '../../__tests__/test-helpers';

/**
 * Feature: gestion-club-tenis, Propiedad 29: Pagos de turnos y luz quedan asociados correctamente
 *
 * **Validates: Requerimientos 12.1, 12.2, 13.1**
 *
 * Para cualquier pago de turno o de luz registrado por un Administrador, el pago debe quedar
 * asociado al turno correspondiente con todos los campos requeridos (monto, fecha, método de pago).
 */

describe('Feature: gestion-club-tenis, Propiedad 29: Pagos de turnos y luz quedan asociados correctamente', () => {
  let app: INestApplication;
  let usuarioRepository: Repository<Usuario>;
  let canchaRepository: Repository<Cancha>;
  let turnoRepository: Repository<Turno>;
  let pagoTurnoRepository: Repository<PagoTurno>;
  let pagoLuzRepository: Repository<PagoLuz>;
  let configuracionRepository: Repository<ConfiguracionClub>;
  let tarifaRepository: Repository<Tarifa>;

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
    turnoRepository = moduleFixture.get<Repository<Turno>>(
      getRepositoryToken(Turno),
    );
    pagoTurnoRepository = moduleFixture.get<Repository<PagoTurno>>(
      getRepositoryToken(PagoTurno),
    );
    pagoLuzRepository = moduleFixture.get<Repository<PagoLuz>>(
      getRepositoryToken(PagoLuz),
    );
    configuracionRepository = moduleFixture.get<Repository<ConfiguracionClub>>(
      getRepositoryToken(ConfiguracionClub),
    );
    tarifaRepository = moduleFixture.get<Repository<Tarifa>>(
      getRepositoryToken(Tarifa),
    );
  }, 30000);

  beforeEach(async () => {
    // Clean up all test data to ensure clean state
    await pagoTurnoRepository.createQueryBuilder().delete().execute();
    await pagoLuzRepository.createQueryBuilder().delete().execute();
    await turnoRepository.createQueryBuilder().delete().execute();
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
    'pagos de turnos quedan asociados correctamente con todos los campos requeridos',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            // Generate admin data
            admin: fc.record({
              email: fc.uuid().map((id) => `test-admin-pago-${id}@example.com`),
              nombre: fc.stringMatching(/^[A-Za-z]{2,30}$/),
              apellido: fc.stringMatching(/^[A-Za-z]{2,30}$/),
              telefono: fc.stringMatching(/^\d{7,15}$/),
              password: fc.stringMatching(/^[A-Za-z0-9]{8,20}$/),
            }),
            // Generate no_socio data
            noSocio: fc.record({
              email: fc.uuid().map((id) => `test-nosocio-pago-${id}@example.com`),
              nombre: fc.stringMatching(/^[A-Za-z]{2,30}$/),
              apellido: fc.stringMatching(/^[A-Za-z]{2,30}$/),
              telefono: fc.stringMatching(/^\d{7,15}$/),
              password: fc.stringMatching(/^[A-Za-z0-9]{8,20}$/),
            }),
            // Generate payment data
            pagoData: fc.record({
              monto: fc.integer({ min: 100, max: 50000 }),
              metodo_pago: fc.oneof(
                fc.constant('efectivo'),
                fc.constant('transferencia'),
                fc.constant('tarjeta'),
                fc.constant('mercado_pago'),
              ),
            }),
            // Generate cancha number
            canchaNumero: fc.integer({ min: 1, max: 10 }),
          }),
          async (data) => {
            const createdEmails: string[] = [];
            let cancha: Cancha | null = null;
            let config: ConfiguracionClub | null = null;
            let tarifa: Tarifa | null = null;
            let admin: Usuario | null = null;
            let noSocio: Usuario | null = null;
            let turno: Turno | null = null;

            try {
              // Step 1: Create configuration
              config = configuracionRepository.create({
                apertura: '08:00:00',
                cierre: '22:00:00',
                luz_inicio: '18:00:00',
                luz_fin: '22:00:00',
                duracion_semana_min: 60,
                duracion_finde_min: 90,
              });
              await configuracionRepository.save(config);

              // Step 2: Create tarifa
              tarifa = tarifaRepository.create({
                tipo: TipoTarifa.TURNO_NO_SOCIO,
                valor: 5000,
                vigente_desde: new Date(),
              });
              await tarifaRepository.save(tarifa);
              // Step 3: Create cancha
              cancha = canchaRepository.create({
                numero: data.canchaNumero,
                estado: EstadoCancha.DISPONIBLE,
              });
              await canchaRepository.save(cancha);

              // Step 4: Create admin user
              createdEmails.push(data.admin.email);
              admin = usuarioRepository.create({
                nombre: data.admin.nombre,
                apellido: data.admin.apellido,
                email: data.admin.email,
                password_hash: await bcrypt.hash(data.admin.password, 10),
                telefono: data.admin.telefono,
                rol: Rol.ADMINISTRADOR,
                activo: true,
              });
              await usuarioRepository.save(admin);

              // Step 5: Create no_socio user
              createdEmails.push(data.noSocio.email);
              noSocio = usuarioRepository.create({
                nombre: data.noSocio.nombre,
                apellido: data.noSocio.apellido,
                email: data.noSocio.email,
                password_hash: await bcrypt.hash(data.noSocio.password, 10),
                telefono: data.noSocio.telefono,
                rol: Rol.NO_SOCIO,
                activo: true,
              });
              await usuarioRepository.save(noSocio);

              // Step 6: Login as admin
              const loginResponse = await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({ email: data.admin.email, password: data.admin.password });
              expect(loginResponse.status).toBe(200);
              const adminToken: string = loginResponse.body.access_token;

              // Step 7: Create a turno for the no_socio (tomorrow at 10:00)
              const tomorrow = new Date();
              tomorrow.setDate(tomorrow.getDate() + 1);
              tomorrow.setHours(10, 0, 0, 0);

              turno = turnoRepository.create({
                usuario_id: noSocio.id,
                cancha_id: cancha.id,
                fecha_inicio: tomorrow,
                fecha_fin: new Date(tomorrow.getTime() + 60 * 60 * 1000), // 1 hour later
                requiere_luz: false,
                costo_turno: 5000,
                costo_luz: 0,
                estado: EstadoTurno.ACTIVO,
              });
              await turnoRepository.save(turno);
              // Step 8: Register payment for the turno
              const pagoResponse = await request(app.getHttpServer())
                .post('/api/pagos/turnos')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                  turno_id: turno.id,
                  monto: data.pagoData.monto,
                  metodo_pago: data.pagoData.metodo_pago,
                });

              // Verify payment was created successfully
              expect(pagoResponse.status).toBe(201);
              expect(pagoResponse.body).toMatchObject({
                turno_id: turno.id,
                monto: data.pagoData.monto,
                metodo_pago: data.pagoData.metodo_pago,
                registrado_por: admin.id,
              });
              expect(pagoResponse.body.id).toBeDefined();
              expect(pagoResponse.body.fecha_pago).toBeDefined();

              // Step 9: Verify payment is correctly stored in database
              const pagoFromDb = await pagoTurnoRepository.findOne({
                where: { turno_id: turno.id },
                relations: ['turno', 'registrado_por_usuario'],
              });

              expect(pagoFromDb).toBeTruthy();
              expect(pagoFromDb!.turno_id).toBe(turno.id);
              expect(Number(pagoFromDb!.monto)).toBe(data.pagoData.monto);
              expect(pagoFromDb!.metodo_pago).toBe(data.pagoData.metodo_pago);
              expect(pagoFromDb!.registrado_por).toBe(admin.id);
              expect(pagoFromDb!.fecha_pago).toBeInstanceOf(Date);

              // Step 10: Verify associations are correct
              expect(pagoFromDb!.turno).toBeTruthy();
              expect(pagoFromDb!.turno.id).toBe(turno.id);
              expect(pagoFromDb!.turno.usuario_id).toBe(noSocio.id);
              expect(pagoFromDb!.registrado_por_usuario).toBeTruthy();
              expect(pagoFromDb!.registrado_por_usuario.id).toBe(admin.id);
              expect(pagoFromDb!.registrado_por_usuario.rol).toBe(Rol.ADMINISTRADOR);

              // Step 11: Verify only No_Socio turnos can have payments
              // Try to register payment for same turno again (should fail)
              const duplicatePaymentResponse = await request(app.getHttpServer())
                .post('/api/pagos/turnos')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                  turno_id: turno.id,
                  monto: data.pagoData.monto,
                  metodo_pago: data.pagoData.metodo_pago,
                });

              expect(duplicatePaymentResponse.status).toBe(400);
              expect(duplicatePaymentResponse.body.message).toContain('Ya existe un pago registrado');

            } finally {
              // Cleanup in correct order to avoid FK constraint violations
              if (turno) {
                await pagoTurnoRepository.delete({ turno_id: turno.id });
                await turnoRepository.delete({ id: turno.id });
              }
              
              for (const email of createdEmails) {
                await usuarioRepository.delete({ email });
              }
              
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
  it(
    'pagos de luz quedan registrados correctamente con todos los campos requeridos',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            // Generate admin data
            admin: fc.record({
              email: fc.uuid().map((id) => `test-admin-luz-${id}@example.com`),
              nombre: fc.stringMatching(/^[A-Za-z]{2,30}$/),
              apellido: fc.stringMatching(/^[A-Za-z]{2,30}$/),
              telefono: fc.stringMatching(/^\d{7,15}$/),
              password: fc.stringMatching(/^[A-Za-z0-9]{8,20}$/),
            }),
            // Generate luz payment data
            pagoLuzData: fc.record({
              monto: fc.integer({ min: 1000, max: 100000 }),
              descripcion: fc.oneof(
                fc.constant('Pago de luz enero 2024'),
                fc.constant('Factura EDESUR mes corriente'),
                fc.constant('Consumo eléctrico canchas'),
                fc.constant(undefined), // Test optional description
              ),
            }),
          }),
          async (data) => {
            const createdEmails: string[] = [];
            let admin: Usuario | null = null;

            try {
              // Step 1: Create admin user
              createdEmails.push(data.admin.email);
              admin = usuarioRepository.create({
                nombre: data.admin.nombre,
                apellido: data.admin.apellido,
                email: data.admin.email,
                password_hash: await bcrypt.hash(data.admin.password, 10),
                telefono: data.admin.telefono,
                rol: Rol.ADMINISTRADOR,
                activo: true,
              });
              await usuarioRepository.save(admin);

              // Step 2: Login as admin
              const loginResponse = await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({ email: data.admin.email, password: data.admin.password });
              expect(loginResponse.status).toBe(200);
              const adminToken: string = loginResponse.body.access_token;

              // Step 3: Register luz payment
              const pagoLuzPayload: any = {
                monto: data.pagoLuzData.monto,
              };
              if (data.pagoLuzData.descripcion !== undefined) {
                pagoLuzPayload.descripcion = data.pagoLuzData.descripcion;
              }

              const pagoResponse = await request(app.getHttpServer())
                .post('/api/pagos/luz')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(pagoLuzPayload);

              // Verify payment was created successfully
              expect(pagoResponse.status).toBe(201);
              expect(pagoResponse.body).toMatchObject({
                monto: data.pagoLuzData.monto,
                registrado_por: admin.id,
              });
              if (data.pagoLuzData.descripcion !== undefined) {
                expect(pagoResponse.body.descripcion).toBe(data.pagoLuzData.descripcion);
              }
              expect(pagoResponse.body.id).toBeDefined();
              expect(pagoResponse.body.fecha_pago).toBeDefined();
              // Step 4: Verify payment is correctly stored in database
              const pagoFromDb = await pagoLuzRepository.findOne({
                where: { id: pagoResponse.body.id },
                relations: ['registrado_por_usuario'],
              });

              expect(pagoFromDb).toBeTruthy();
              expect(Number(pagoFromDb!.monto)).toBe(data.pagoLuzData.monto);
              expect(pagoFromDb!.registrado_por).toBe(admin.id);
              expect(pagoFromDb!.fecha_pago).toBeInstanceOf(Date);
              
              if (data.pagoLuzData.descripcion !== undefined) {
                expect(pagoFromDb!.descripcion).toBe(data.pagoLuzData.descripcion);
              } else {
                expect(pagoFromDb!.descripcion).toBeNull();
              }

              // Step 5: Verify association with admin user
              expect(pagoFromDb!.registrado_por_usuario).toBeTruthy();
              expect(pagoFromDb!.registrado_por_usuario.id).toBe(admin.id);
              expect(pagoFromDb!.registrado_por_usuario.rol).toBe(Rol.ADMINISTRADOR);

              // Step 6: Verify payment appears in luz payments list
              const listResponse = await request(app.getHttpServer())
                .get('/api/pagos/luz')
                .set('Authorization', `Bearer ${adminToken}`);

              expect(listResponse.status).toBe(200);
              expect(Array.isArray(listResponse.body)).toBe(true);
              
              const foundPago = listResponse.body.find(p => p.id === pagoResponse.body.id);
              expect(foundPago).toBeTruthy();
              expect(Number(foundPago.monto)).toBe(data.pagoLuzData.monto);
              if (data.pagoLuzData.descripcion !== undefined) {
                expect(foundPago.descripcion).toBe(data.pagoLuzData.descripcion);
              }

            } finally {
              // Cleanup in correct order to avoid FK constraint violations
              if (admin) {
                await pagoLuzRepository.delete({ registrado_por: admin.id });
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
  it(
    'solo se pueden registrar pagos para turnos de No_Socios',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            // Generate admin data
            admin: fc.record({
              email: fc.uuid().map((id) => `test-admin-socio-${id}@example.com`),
              nombre: fc.stringMatching(/^[A-Za-z]{2,30}$/),
              apellido: fc.stringMatching(/^[A-Za-z]{2,30}$/),
              telefono: fc.stringMatching(/^\d{7,15}$/),
              password: fc.stringMatching(/^[A-Za-z0-9]{8,20}$/),
            }),
            // Generate socio data
            socio: fc.record({
              email: fc.uuid().map((id) => `test-socio-turno-${id}@example.com`),
              nombre: fc.stringMatching(/^[A-Za-z]{2,30}$/),
              apellido: fc.stringMatching(/^[A-Za-z]{2,30}$/),
              telefono: fc.stringMatching(/^\d{7,15}$/),
              password: fc.stringMatching(/^[A-Za-z0-9]{8,20}$/),
            }),
            // Generate payment data
            pagoData: fc.record({
              monto: fc.integer({ min: 100, max: 50000 }),
              metodo_pago: fc.oneof(
                fc.constant('efectivo'),
                fc.constant('transferencia'),
                fc.constant('tarjeta'),
              ),
            }),
            // Generate cancha number
            canchaNumero: fc.integer({ min: 1, max: 10 }),
          }),
          async (data) => {
            const createdEmails: string[] = [];
            let cancha: Cancha | null = null;
            let config: ConfiguracionClub | null = null;
            let tarifa: Tarifa | null = null;
            let admin: Usuario | null = null;
            let socio: Usuario | null = null;
            let turno: Turno | null = null;

            try {
              // Step 1: Create configuration
              config = configuracionRepository.create({
                apertura: '08:00:00',
                cierre: '22:00:00',
                luz_inicio: '18:00:00',
                luz_fin: '22:00:00',
                duracion_semana_min: 60,
                duracion_finde_min: 90,
              });
              await configuracionRepository.save(config);

              // Step 2: Create tarifa
              tarifa = tarifaRepository.create({
                tipo: TipoTarifa.TURNO_NO_SOCIO,
                valor: 5000,
                vigente_desde: new Date(),
              });
              await tarifaRepository.save(tarifa);

              // Step 3: Create cancha
              cancha = canchaRepository.create({
                numero: data.canchaNumero,
                estado: EstadoCancha.DISPONIBLE,
              });
              await canchaRepository.save(cancha);
              // Step 4: Create admin user
              createdEmails.push(data.admin.email);
              admin = usuarioRepository.create({
                nombre: data.admin.nombre,
                apellido: data.admin.apellido,
                email: data.admin.email,
                password_hash: await bcrypt.hash(data.admin.password, 10),
                telefono: data.admin.telefono,
                rol: Rol.ADMINISTRADOR,
                activo: true,
              });
              await usuarioRepository.save(admin);

              // Step 5: Create socio user (not No_Socio)
              createdEmails.push(data.socio.email);
              socio = usuarioRepository.create({
                nombre: data.socio.nombre,
                apellido: data.socio.apellido,
                email: data.socio.email,
                password_hash: await bcrypt.hash(data.socio.password, 10),
                telefono: data.socio.telefono,
                rol: Rol.SOCIO, // This is the key difference
                activo: true,
              });
              await usuarioRepository.save(socio);

              // Step 6: Login as admin
              const loginResponse = await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({ email: data.admin.email, password: data.admin.password });
              expect(loginResponse.status).toBe(200);
              const adminToken: string = loginResponse.body.access_token;

              // Step 7: Create a turno for the socio (tomorrow at 10:00)
              const tomorrow = new Date();
              tomorrow.setDate(tomorrow.getDate() + 1);
              tomorrow.setHours(10, 0, 0, 0);

              turno = turnoRepository.create({
                usuario_id: socio.id,
                cancha_id: cancha.id,
                fecha_inicio: tomorrow,
                fecha_fin: new Date(tomorrow.getTime() + 60 * 60 * 1000), // 1 hour later
                requiere_luz: false,
                costo_turno: 0, // Socios don't pay for turnos
                costo_luz: 0,
                estado: EstadoTurno.ACTIVO,
              });
              await turnoRepository.save(turno);

              // Step 8: Try to register payment for socio's turno (should fail)
              const pagoResponse = await request(app.getHttpServer())
                .post('/api/pagos/turnos')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                  turno_id: turno.id,
                  monto: data.pagoData.monto,
                  metodo_pago: data.pagoData.metodo_pago,
                });

              // Verify payment was rejected
              expect(pagoResponse.status).toBe(400);
              expect(pagoResponse.body.message).toContain('Solo se pueden registrar pagos para turnos de No_Socios');

              // Step 9: Verify no payment was created in database
              const pagoFromDb = await pagoTurnoRepository.findOne({
                where: { turno_id: turno.id },
              });
              expect(pagoFromDb).toBeNull();

            } finally {
              // Cleanup in correct order to avoid FK constraint violations
              if (turno) {
                await turnoRepository.delete({ id: turno.id });
              }
              
              for (const email of createdEmails) {
                await usuarioRepository.delete({ email });
              }
              
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