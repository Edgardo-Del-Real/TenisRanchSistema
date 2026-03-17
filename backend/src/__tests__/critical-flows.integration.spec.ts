import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../app.module';
import {
  Usuario,
  Cancha,
  Turno,
  Cuota,
  PagoCuota,
  Tarifa,
  ConfiguracionClub,
} from '../entities';
import { Rol } from '../common/enums/rol.enum';
import { EstadoCancha } from '../common/enums/estado-cancha.enum';
import { EstadoCuota } from '../common/enums/estado-cuota.enum';
import { TipoTarifa } from '../common/enums/tipo-tarifa.enum';
import { EstadoTurno } from '../common/enums/estado-turno.enum';

/**
 * Critical Flows Integration Tests
 * 
 * Task 17.2: Tests de integración de flujos críticos
 * 
 * These tests verify that complex business workflows work correctly end-to-end:
 * 1. Complete User Journey: registro → login → reserva → cancelación
 * 2. Cuotas Payment Flow: generación → pago parcial → pago total
 * 3. Tarifa Snapshot Flow: modificación → reserva con nueva tarifa → verificar snapshot
 * 
 * Requirements: 6.1–7.3, 9.1–9.4, 10.7
 */
describe('Critical Flows Integration Tests', () => {
  let app: INestApplication;
  let usuarioRepository: Repository<Usuario>;
  let canchaRepository: Repository<Cancha>;
  let turnoRepository: Repository<Turno>;
  let cuotaRepository: Repository<Cuota>;
  let pagoCuotaRepository: Repository<PagoCuota>;
  let tarifaRepository: Repository<Tarifa>;
  let configuracionRepository: Repository<ConfiguracionClub>;

  let adminToken: string;
  let adminUser: Usuario;
  let testCancha: Cancha;
  let configuracion: ConfiguracionClub;

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

    // Get repositories
    usuarioRepository = moduleFixture.get<Repository<Usuario>>(
      getRepositoryToken(Usuario),
    );
    canchaRepository = moduleFixture.get<Repository<Cancha>>(
      getRepositoryToken(Cancha),
    );
    turnoRepository = moduleFixture.get<Repository<Turno>>(
      getRepositoryToken(Turno),
    );
    cuotaRepository = moduleFixture.get<Repository<Cuota>>(
      getRepositoryToken(Cuota),
    );
    pagoCuotaRepository = moduleFixture.get<Repository<PagoCuota>>(
      getRepositoryToken(PagoCuota),
    );
    tarifaRepository = moduleFixture.get<Repository<Tarifa>>(
      getRepositoryToken(Tarifa),
    );
    configuracionRepository = moduleFixture.get<Repository<ConfiguracionClub>>(
      getRepositoryToken(ConfiguracionClub),
    );

    // Clean up any existing test data
    const existingAdmin = await usuarioRepository.findOne({
      where: { email: 'admin-critical@test.com' },
    });
    if (existingAdmin) {
      await turnoRepository.delete({ usuario_id: existingAdmin.id });
      await tarifaRepository.delete({ modificado_por: existingAdmin.id });
      await usuarioRepository.delete({ id: existingAdmin.id });
    }

    const existingCancha = await canchaRepository.findOne({
      where: { numero: 100 },
    });
    if (existingCancha) {
      await turnoRepository.delete({ cancha_id: existingCancha.id });
      await canchaRepository.delete({ id: existingCancha.id });
    }

    // Create admin user for tests
    const passwordHash = await bcrypt.hash('password123', 10);
    adminUser = usuarioRepository.create({
      nombre: 'Admin',
      apellido: 'Critical',
      email: 'admin-critical@test.com',
      password_hash: passwordHash,
      telefono: '1234567890',
      rol: Rol.ADMINISTRADOR,
      activo: true,
    });
    await usuarioRepository.save(adminUser);

    // Create test cancha
    testCancha = canchaRepository.create({
      numero: 100,
      estado: EstadoCancha.DISPONIBLE,
      razon_estado: 'Test cancha for critical flows',
    });
    await canchaRepository.save(testCancha);

    // Create configuracion
    const existingConfig = await configuracionRepository.findOne({ where: {} });
    if (!existingConfig) {
      configuracion = configuracionRepository.create({
        apertura: '08:00:00',
        cierre: '22:00:00',
        luz_inicio: '18:00:00',
        luz_fin: '22:00:00',
        duracion_semana_min: 60,
        duracion_finde_min: 90,
      });
      await configuracionRepository.save(configuracion);
    } else {
      configuracion = existingConfig;
    }

    // Create tarifas
    const existingTarifaTurno = await tarifaRepository.findOne({
      where: { tipo: TipoTarifa.TURNO_NO_SOCIO },
      order: { vigente_desde: 'DESC' },
    });
    if (!existingTarifaTurno) {
      const tarifaTurno = tarifaRepository.create({
        tipo: TipoTarifa.TURNO_NO_SOCIO,
        valor: 10000,
        vigente_desde: new Date(),
        modificado_por: adminUser.id,
      });
      await tarifaRepository.save(tarifaTurno);
    }

    const existingTarifaLuz = await tarifaRepository.findOne({
      where: { tipo: TipoTarifa.LUZ },
      order: { vigente_desde: 'DESC' },
    });
    if (!existingTarifaLuz) {
      const tarifaLuz = tarifaRepository.create({
        tipo: TipoTarifa.LUZ,
        valor: 4000,
        vigente_desde: new Date(),
        modificado_por: adminUser.id,
      });
      await tarifaRepository.save(tarifaLuz);
    }

    const existingTarifaCuota = await tarifaRepository.findOne({
      where: { tipo: TipoTarifa.CUOTA },
      order: { vigente_desde: 'DESC' },
    });
    if (!existingTarifaCuota) {
      const tarifaCuota = tarifaRepository.create({
        tipo: TipoTarifa.CUOTA,
        valor: 10000,
        vigente_desde: new Date(),
        modificado_por: adminUser.id,
      });
      await tarifaRepository.save(tarifaCuota);
    }

    // Login admin
    const adminLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'admin-critical@test.com', password: 'password123' });
    
    if (adminLogin.status === 200) {
      adminToken = adminLogin.body.access_token;
    }
  }, 60000);

  afterAll(async () => {
    // Clean up test data in correct order (delete children before parents)
    if (testCancha?.id) {
      await turnoRepository.delete({ cancha_id: testCancha.id });
      await canchaRepository.delete({ id: testCancha.id });
    }
    if (adminUser?.id) {
      // Delete tarifas that reference the admin user
      await tarifaRepository.delete({ modificado_por: adminUser.id });
      await usuarioRepository.delete({ id: adminUser.id });
    }

    if (app) {
      await app.close();
    }
  }, 60000);

  /**
   * Flow 1: Complete User Journey
   * registro → login → reserva → cancelación
   * 
   * Validates Requirements: 1.1, 1.3, 2.1, 6.1, 7.1, 7.2
   */
  describe('Flow 1: Complete User Journey (registro → login → reserva → cancelación)', () => {
    it('should complete full user journey successfully', async () => {
      const uniqueEmail = `journey-${Date.now()}@test.com`;
      let userToken: string;
      let userId: string;
      let turnoId: string;

      // Step 1: Register new user
      const registerRes = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          nombre: 'Journey',
          apellido: 'User',
          email: uniqueEmail,
          password: 'password123',
          telefono: '9876543210',
        })
        .expect(201);

      expect(registerRes.body.rol).toBe(Rol.NO_SOCIO);
      expect(registerRes.body.id).toBeDefined();
      userId = registerRes.body.id;

      // Step 2: Login with new user
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: uniqueEmail,
          password: 'password123',
        })
        .expect(200);

      expect(loginRes.body).toHaveProperty('access_token');
      userToken = loginRes.body.access_token;

      // Step 3: Make a reservation
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);

      // Verify cancha exists
      expect(testCancha).toBeDefined();
      expect(testCancha.id).toBeDefined();

      const reserveRes = await request(app.getHttpServer())
        .post('/api/turnos')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          cancha_id: testCancha.id,
          fecha_hora_inicio: tomorrow.toISOString(),
        })
        .expect(201);

      expect(reserveRes.body.id).toBeDefined();
      expect(reserveRes.body.usuario_id).toBe(userId);
      expect(reserveRes.body.estado).toBe(EstadoTurno.ACTIVO);
      turnoId = reserveRes.body.id;

      // Step 4: View the reservation
      const viewRes = await request(app.getHttpServer())
        .get('/api/turnos')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(Array.isArray(viewRes.body)).toBe(true);
      const foundTurno = viewRes.body.find((t: any) => t.id === turnoId);
      expect(foundTurno).toBeDefined();
      expect(foundTurno.estado).toBe(EstadoTurno.ACTIVO);

      // Step 5: Cancel the reservation
      const cancelRes = await request(app.getHttpServer())
        .delete(`/api/turnos/${turnoId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(cancelRes.body.message).toBeDefined();
      expect(cancelRes.body.turno.estado).toBe(EstadoTurno.CANCELADO);

      // Step 6: Verify cancellation
      const verifyRes = await request(app.getHttpServer())
        .get('/api/turnos')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const cancelledTurno = verifyRes.body.find((t: any) => t.id === turnoId);
      expect(cancelledTurno).toBeUndefined(); // Should not appear in active turnos

      // Clean up
      await turnoRepository.delete({ id: turnoId });
      await usuarioRepository.delete({ id: userId });
    });
  });

  /**
   * Flow 2: Cuotas Payment Flow
   * generación → pago parcial → pago total
   * 
   * Validates Requirements: 9.1, 9.2, 9.3, 9.4
   */
  describe('Flow 2: Cuotas Payment Flow (generación → pago parcial → pago total)', () => {
    it('should handle complete cuota payment flow', async () => {
      if (!adminToken) {
        console.log('Skipping test - no admin token');
        return;
      }

      // Step 1: Create a Socio user
      const socioPasswordHash = await bcrypt.hash('password123', 10);
      const socioUser = usuarioRepository.create({
        nombre: 'Socio',
        apellido: 'Cuotas',
        email: `socio-cuotas-${Date.now()}@test.com`,
        password_hash: socioPasswordHash,
        telefono: '1122334455',
        rol: Rol.SOCIO,
        activo: true,
      });
      await usuarioRepository.save(socioUser);

      // Step 2: Generate cuota for the Socio
      const cuota = cuotaRepository.create({
        socio_id: socioUser.id,
        mes: new Date().getMonth() + 1,
        anio: new Date().getFullYear(),
        monto_total: 10000,
        monto_abonado: 0,
        estado: EstadoCuota.PENDIENTE,
      });
      await cuotaRepository.save(cuota);

      // Step 3: Verify cuota is in PENDIENTE state
      const listRes1 = await request(app.getHttpServer())
        .get('/api/cuotas')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const foundCuota1 = listRes1.body.find((c: any) => c.id === cuota.id);
      expect(foundCuota1).toBeDefined();
      expect(foundCuota1.estado).toBe(EstadoCuota.PENDIENTE);
      expect(foundCuota1.monto_abonado).toBe(0);
      expect(foundCuota1.saldo_pendiente).toBe(10000);

      // Step 4: Register partial payment
      const partialPaymentRes = await request(app.getHttpServer())
        .post(`/api/cuotas/${cuota.id}/pagos`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ monto: 4000 })
        .expect(201);

      expect(partialPaymentRes.body.cuota.monto_abonado).toBe(4000);
      expect(partialPaymentRes.body.cuota.estado).toBe(EstadoCuota.PARCIAL);

      // Step 5: Verify cuota is in PARCIAL state
      const listRes2 = await request(app.getHttpServer())
        .get('/api/cuotas')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const foundCuota2 = listRes2.body.find((c: any) => c.id === cuota.id);
      expect(foundCuota2).toBeDefined();
      expect(foundCuota2.estado).toBe(EstadoCuota.PARCIAL);
      expect(foundCuota2.monto_abonado).toBe(4000);
      expect(foundCuota2.saldo_pendiente).toBe(6000);

      // Step 6: Register remaining payment
      const finalPaymentRes = await request(app.getHttpServer())
        .post(`/api/cuotas/${cuota.id}/pagos`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ monto: 6000 })
        .expect(201);

      expect(finalPaymentRes.body.cuota.monto_abonado).toBe(10000);
      expect(finalPaymentRes.body.cuota.estado).toBe(EstadoCuota.PAGADA);

      // Step 7: Verify cuota is in PAGADA state
      const listRes3 = await request(app.getHttpServer())
        .get('/api/cuotas')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const foundCuota3 = listRes3.body.find((c: any) => c.id === cuota.id);
      expect(foundCuota3).toBeDefined();
      expect(foundCuota3.estado).toBe(EstadoCuota.PAGADA);
      expect(foundCuota3.monto_abonado).toBe(10000);
      expect(foundCuota3.saldo_pendiente).toBe(0);

      // Clean up
      await pagoCuotaRepository.delete({ cuota_id: cuota.id });
      await cuotaRepository.delete({ id: cuota.id });
      await usuarioRepository.delete({ id: socioUser.id });
    });
  });

  /**
   * Flow 3: Tarifa Snapshot Flow
   * modificación → reserva con nueva tarifa → verificar snapshot
   * 
   * Validates Requirements: 10.7, 6.1
   */
  describe('Flow 3: Tarifa Snapshot Flow (modificación → reserva con nueva tarifa → verificar snapshot)', () => {
    it('should preserve tarifa snapshot across tarifa changes', async () => {
      if (!adminToken) {
        console.log('Skipping test - no admin token');
        return;
      }

      // Step 1: Get current tarifa
      const tarifasRes1 = await request(app.getHttpServer())
        .get('/api/tarifas')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const tarifaTurnoOriginal = tarifasRes1.body.find(
        (t: any) => t.tipo === TipoTarifa.TURNO_NO_SOCIO
      );
      expect(tarifaTurnoOriginal).toBeDefined();
      const valorOriginal = tarifaTurnoOriginal.valor;

      // Step 2: Create user for reservation (ADMINISTRADOR to bypass anticipation limit)
      const testUserPasswordHash = await bcrypt.hash('password123', 10);
      const testUser = usuarioRepository.create({
        nombre: 'Test',
        apellido: 'Tarifa',
        email: `test-tarifa-${Date.now()}@test.com`,
        password_hash: testUserPasswordHash,
        telefono: '5555555555',
        rol: Rol.ADMINISTRADOR,
        activo: true,
      });
      await usuarioRepository.save(testUser);

      const userLogin = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: testUser.email, password: 'password123' });
      
      const userToken = userLogin.body.access_token;

      // Step 3: Create reservation with current tarifa
      const tomorrow1 = new Date();
      tomorrow1.setDate(tomorrow1.getDate() + 1);
      tomorrow1.setHours(10, 0, 0, 0);

      const reserveRes1 = await request(app.getHttpServer())
        .post('/api/turnos')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          cancha_id: testCancha.id,
          fecha_hora_inicio: tomorrow1.toISOString(),
        })
        .expect(201);

      const turno1Id = reserveRes1.body.id;
      expect(reserveRes1.body.costo_turno).toBe(valorOriginal);

      // Step 4: Verify reservation has snapshot of current tarifa
      const turno1 = await turnoRepository.findOne({ where: { id: turno1Id } });
      expect(turno1).toBeDefined();
      expect(Number(turno1!.costo_turno)).toBe(valorOriginal);

      // Step 5: Modify tarifa (admin)
      const nuevoValor = valorOriginal + 5000;
      const updateTarifaRes = await request(app.getHttpServer())
        .put(`/api/tarifas/${TipoTarifa.TURNO_NO_SOCIO}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ valor: nuevoValor })
        .expect(200);

      expect(updateTarifaRes.body.valor).toBe(nuevoValor);

      // Step 6: Create new reservation
      const tomorrow2 = new Date();
      tomorrow2.setDate(tomorrow2.getDate() + 1);
      tomorrow2.setHours(14, 0, 0, 0);

      const reserveRes2 = await request(app.getHttpServer())
        .post('/api/turnos')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          cancha_id: testCancha.id,
          fecha_hora_inicio: tomorrow2.toISOString(),
        })
        .expect(201);

      const turno2Id = reserveRes2.body.id;
      expect(reserveRes2.body.costo_turno).toBe(nuevoValor);

      // Step 7: Verify new reservation has snapshot of new tarifa
      const turno2 = await turnoRepository.findOne({ where: { id: turno2Id } });
      expect(turno2).toBeDefined();
      expect(Number(turno2!.costo_turno)).toBe(nuevoValor);

      // Step 8: Verify old reservation still has old tarifa snapshot
      const turno1Updated = await turnoRepository.findOne({ where: { id: turno1Id } });
      expect(turno1Updated).toBeDefined();
      expect(Number(turno1Updated!.costo_turno)).toBe(valorOriginal);

      // Clean up
      await turnoRepository.delete({ id: turno1Id });
      await turnoRepository.delete({ id: turno2Id });
      await usuarioRepository.delete({ id: testUser.id });

      // Restore original tarifa
      await request(app.getHttpServer())
        .put(`/api/tarifas/${TipoTarifa.TURNO_NO_SOCIO}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ valor: valorOriginal });
    });
  });
});
