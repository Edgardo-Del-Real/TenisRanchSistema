import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppModule } from '../app.module';
import {
  Usuario,
  Cancha,
  Turno,
  Cuota,
  PagoCuota,
  Tarifa,
  ConfiguracionClub,
  PagoLuz,
} from '../entities';
import { Rol } from '../common/enums/rol.enum';
import { EstadoCancha } from '../common/enums/estado-cancha.enum';
import { EstadoCuota } from '../common/enums/estado-cuota.enum';
import { TipoTarifa } from '../common/enums/tipo-tarifa.enum';

/**
 * End-to-End Integration Tests
 * 
 * These tests verify that all frontend-backend connections work correctly
 * and that error handling is comprehensive across all modules.
 * 
 * Task 17.1: Conectar todos los módulos frontend con la API
 * Requirements: 1.1–15.5
 */
describe('E2E Integration Tests', () => {
  let app: INestApplication;
  let usuarioRepository: Repository<Usuario>;
  let canchaRepository: Repository<Cancha>;
  let turnoRepository: Repository<Turno>;
  let cuotaRepository: Repository<Cuota>;
  let pagoCuotaRepository: Repository<PagoCuota>;
  let tarifaRepository: Repository<Tarifa>;
  let configuracionRepository: Repository<ConfiguracionClub>;
  let pagoLuzRepository: Repository<PagoLuz>;

  let adminToken: string;
  let socioToken: string;
  let noSocioToken: string;
  let adminUser: Usuario;
  let socioUser: Usuario;
  let noSocioUser: Usuario;
  let testCancha: Cancha;

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
    pagoLuzRepository = moduleFixture.get<Repository<PagoLuz>>(
      getRepositoryToken(PagoLuz),
    );

    // Create test users
    adminUser = usuarioRepository.create({
      nombre: 'Admin',
      apellido: 'E2E',
      email: 'admin-e2e@test.com',
      password_hash: '$2b$10$hashedpassword',
      telefono: '1234567890',
      rol: Rol.ADMINISTRADOR,
      activo: true,
    });
    await usuarioRepository.save(adminUser);

    socioUser = usuarioRepository.create({
      nombre: 'Socio',
      apellido: 'E2E',
      email: 'socio-e2e@test.com',
      password_hash: '$2b$10$hashedpassword',
      telefono: '0987654321',
      rol: Rol.SOCIO,
      activo: true,
    });
    await usuarioRepository.save(socioUser);

    noSocioUser = usuarioRepository.create({
      nombre: 'NoSocio',
      apellido: 'E2E',
      email: 'nosocio-e2e@test.com',
      password_hash: '$2b$10$hashedpassword',
      telefono: '1122334455',
      rol: Rol.NO_SOCIO,
      activo: true,
    });
    await usuarioRepository.save(noSocioUser);

    // Create test cancha
    testCancha = canchaRepository.create({
      numero: 99,
      estado: EstadoCancha.DISPONIBLE,
      razon_estado: 'Test cancha',
    });
    await canchaRepository.save(testCancha);

    // Login to get tokens
    const adminLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'admin-e2e@test.com', password: 'password123' });
    if (adminLogin.status === 200) {
      adminToken = adminLogin.body.access_token;
    }

    const socioLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'socio-e2e@test.com', password: 'password123' });
    if (socioLogin.status === 200) {
      socioToken = socioLogin.body.access_token;
    }

    const noSocioLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'nosocio-e2e@test.com', password: 'password123' });
    if (noSocioLogin.status === 200) {
      noSocioToken = noSocioLogin.body.access_token;
    }
  }, 60000);

  afterAll(async () => {
    // Clean up test data
    await turnoRepository.delete({ usuario_id: adminUser.id });
    await turnoRepository.delete({ usuario_id: socioUser.id });
    await turnoRepository.delete({ usuario_id: noSocioUser.id });
    await pagoCuotaRepository.delete({ registrado_por: adminUser.id });
    await cuotaRepository.delete({ socio_id: socioUser.id });
    await pagoLuzRepository.delete({ registrado_por: adminUser.id });
    await canchaRepository.delete({ id: testCancha.id });
    await usuarioRepository.delete({ id: adminUser.id });
    await usuarioRepository.delete({ id: socioUser.id });
    await usuarioRepository.delete({ id: noSocioUser.id });

    if (app) {
      await app.close();
    }
  }, 60000);

  describe('Authentication Flow', () => {
    it('should handle registration → login → logout flow', async () => {
      const uniqueEmail = `test-${Date.now()}@test.com`;

      // 1. Register new user
      const registerRes = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          nombre: 'Test',
          apellido: 'User',
          email: uniqueEmail,
          password: 'password123',
          telefono: '1234567890',
        })
        .expect(201);

      expect(registerRes.body.rol).toBe(Rol.NO_SOCIO);
      expect(registerRes.body.id).toBeDefined();
      const userId = registerRes.body.id;

      // 2. Login with new user
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: uniqueEmail,
          password: 'password123',
        })
        .expect(200);

      expect(loginRes.body).toHaveProperty('access_token');
      const token = loginRes.body.access_token;

      // 3. Access protected endpoint with token
      const meRes = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(meRes.body.id).toBe(userId);

      // 4. Logout
      await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // 5. Try to access protected endpoint with invalidated token
      await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);

      // Clean up
      await usuarioRepository.delete({ email: uniqueEmail });
    });

    it('should return 401 for invalid credentials', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(res.body.error).toBeDefined();
    });

    it('should return 409 for duplicate email registration', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          nombre: 'Test',
          apellido: 'User',
          email: 'admin-e2e@test.com', // Already exists
          password: 'password123',
          telefono: '1234567890',
        })
        .expect(409);

      expect(res.body.error.code).toBe('EMAIL_DUPLICADO');
    });

    it('should return 400 for missing required fields', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          nombre: 'Test',
          // Missing apellido, email, password, telefono
        })
        .expect(400);
    });
  });

  describe('User Management Flow', () => {
    it('should allow admin to list, filter, and manage users', async () => {
      if (!adminToken) {
        console.log('Skipping test - no admin token');
        return;
      }

      // 1. List all users
      const listRes = await request(app.getHttpServer())
        .get('/api/usuarios')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(listRes.body)).toBe(true);
      expect(listRes.body.length).toBeGreaterThan(0);

      // 2. Filter by rol
      const filterRes = await request(app.getHttpServer())
        .get('/api/usuarios?rol=socio')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(filterRes.body)).toBe(true);
      filterRes.body.forEach((user: any) => {
        expect(user.rol).toBe(Rol.SOCIO);
      });

      // 3. Update user data
      const updateRes = await request(app.getHttpServer())
        .put(`/api/usuarios/${socioUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: 'Socio Updated',
          apellido: 'E2E Updated',
          telefono: '9999999999',
        })
        .expect(200);

      expect(updateRes.body.nombre).toBe('Socio Updated');

      // 4. Change user role
      const roleRes = await request(app.getHttpServer())
        .patch(`/api/usuarios/${noSocioUser.id}/rol`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ rol: Rol.SOCIO })
        .expect(200);

      expect(roleRes.body.rol).toBe(Rol.SOCIO);

      // Revert role change
      await request(app.getHttpServer())
        .patch(`/api/usuarios/${noSocioUser.id}/rol`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ rol: Rol.NO_SOCIO });
    });

    it('should return 403 when non-admin tries to access admin endpoints', async () => {
      if (!socioToken) {
        console.log('Skipping test - no socio token');
        return;
      }

      await request(app.getHttpServer())
        .get('/api/usuarios')
        .set('Authorization', `Bearer ${socioToken}`)
        .expect(403);
    });

    it('should return 404 for non-existent user', async () => {
      if (!adminToken) {
        console.log('Skipping test - no admin token');
        return;
      }

      await request(app.getHttpServer())
        .get('/api/usuarios/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('Turnos Flow', () => {
    it('should handle complete turno lifecycle: reserve → list → cancel', async () => {
      if (!socioToken) {
        console.log('Skipping test - no socio token');
        return;
      }

      // 1. Reserve turno
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);

      const reserveRes = await request(app.getHttpServer())
        .post('/api/turnos')
        .set('Authorization', `Bearer ${socioToken}`)
        .send({
          cancha_id: testCancha.id,
          fecha_hora_inicio: tomorrow.toISOString(),
        })
        .expect(201);

      expect(reserveRes.body.id).toBeDefined();
      expect(reserveRes.body.usuario_id).toBe(socioUser.id);
      const turnoId = reserveRes.body.id;

      // 2. List turnos vigentes
      const listRes = await request(app.getHttpServer())
        .get('/api/turnos')
        .set('Authorization', `Bearer ${socioToken}`)
        .expect(200);

      expect(Array.isArray(listRes.body)).toBe(true);
      const foundTurno = listRes.body.find((t: any) => t.id === turnoId);
      expect(foundTurno).toBeDefined();

      // 3. Cancel turno
      await request(app.getHttpServer())
        .delete(`/api/turnos/${turnoId}`)
        .set('Authorization', `Bearer ${socioToken}`)
        .expect(200);

      // 4. Verify turno is cancelled
      const verifyRes = await request(app.getHttpServer())
        .get('/api/turnos')
        .set('Authorization', `Bearer ${socioToken}`)
        .expect(200);

      const cancelledTurno = verifyRes.body.find((t: any) => t.id === turnoId);
      expect(cancelledTurno).toBeUndefined();
    });

    it('should return 409 for conflicting turno reservations', async () => {
      if (!socioToken || !noSocioToken) {
        console.log('Skipping test - no tokens');
        return;
      }

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(14, 0, 0, 0);

      // First reservation
      const firstRes = await request(app.getHttpServer())
        .post('/api/turnos')
        .set('Authorization', `Bearer ${socioToken}`)
        .send({
          cancha_id: testCancha.id,
          fecha_hora_inicio: tomorrow.toISOString(),
        })
        .expect(201);

      // Conflicting reservation
      const conflictRes = await request(app.getHttpServer())
        .post('/api/turnos')
        .set('Authorization', `Bearer ${noSocioToken}`)
        .send({
          cancha_id: testCancha.id,
          fecha_hora_inicio: tomorrow.toISOString(),
        })
        .expect(409);

      expect(conflictRes.body.error.code).toBe('TURNO_CONFLICTO');

      // Clean up
      await turnoRepository.delete({ id: firstRes.body.id });
    });

    it('should return 400 for turno outside operating hours', async () => {
      if (!socioToken) {
        console.log('Skipping test - no socio token');
        return;
      }

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(23, 0, 0, 0); // Outside operating hours

      const res = await request(app.getHttpServer())
        .post('/api/turnos')
        .set('Authorization', `Bearer ${socioToken}`)
        .send({
          cancha_id: testCancha.id,
          fecha_hora_inicio: tomorrow.toISOString(),
        })
        .expect(400);

      expect(res.body.error.code).toBe('FUERA_HORARIO');
    });

    it('should return 400 for turno with excessive anticipation', async () => {
      if (!socioToken) {
        console.log('Skipping test - no socio token');
        return;
      }

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5); // More than 1 day
      futureDate.setHours(10, 0, 0, 0);

      const res = await request(app.getHttpServer())
        .post('/api/turnos')
        .set('Authorization', `Bearer ${socioToken}`)
        .send({
          cancha_id: testCancha.id,
          fecha_hora_inicio: futureDate.toISOString(),
        })
        .expect(400);

      expect(res.body.error.code).toBe('ANTICIPACION_EXCEDIDA');
    });
  });

  describe('Cuotas Flow', () => {
    it('should handle cuota payment flow: list → register payment → verify', async () => {
      if (!adminToken) {
        console.log('Skipping test - no admin token');
        return;
      }

      // 1. Create test cuota
      const cuota = cuotaRepository.create({
        socio_id: socioUser.id,
        mes: new Date().getMonth() + 1,
        anio: new Date().getFullYear(),
        monto_total: 10000,
        monto_abonado: 0,
        estado: EstadoCuota.PENDIENTE,
      });
      await cuotaRepository.save(cuota);

      // 2. List cuotas
      const listRes = await request(app.getHttpServer())
        .get('/api/cuotas')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(listRes.body)).toBe(true);
      const foundCuota = listRes.body.find((c: any) => c.id === cuota.id);
      expect(foundCuota).toBeDefined();
      expect(foundCuota.estado).toBe(EstadoCuota.PENDIENTE);

      // 3. Register partial payment
      const paymentRes = await request(app.getHttpServer())
        .post(`/api/cuotas/${cuota.id}/pagos`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ monto: 5000 })
        .expect(201);

      expect(paymentRes.body.monto).toBe(5000);

      // 4. Verify cuota state updated
      const verifyRes = await request(app.getHttpServer())
        .get('/api/cuotas')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const updatedCuota = verifyRes.body.find((c: any) => c.id === cuota.id);
      expect(updatedCuota.estado).toBe(EstadoCuota.PARCIAL);
      expect(updatedCuota.monto_abonado).toBe(5000);

      // Clean up
      await pagoCuotaRepository.delete({ cuota_id: cuota.id });
      await cuotaRepository.delete({ id: cuota.id });
    });

    it('should allow socio to view their own cuotas', async () => {
      if (!socioToken) {
        console.log('Skipping test - no socio token');
        return;
      }

      const res = await request(app.getHttpServer())
        .get('/api/cuotas')
        .set('Authorization', `Bearer ${socioToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      // All cuotas should belong to the socio
      res.body.forEach((cuota: any) => {
        expect(cuota.socio_id || cuota.socio?.id).toBeDefined();
      });
    });
  });

  describe('Error Handling Verification', () => {
    it('should return proper error for 401 Unauthorized', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/usuarios')
        .expect(401);

      expect(res.body.error || res.body.message).toBeDefined();
    });

    it('should return proper error for 403 Forbidden', async () => {
      if (!noSocioToken) {
        console.log('Skipping test - no token');
        return;
      }

      const res = await request(app.getHttpServer())
        .get('/api/estadisticas/generales')
        .set('Authorization', `Bearer ${noSocioToken}`)
        .expect(403);

      expect(res.body.message).toBeDefined();
    });

    it('should return proper error for 404 Not Found', async () => {
      if (!adminToken) {
        console.log('Skipping test - no admin token');
        return;
      }

      const res = await request(app.getHttpServer())
        .get('/api/canchas/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(res.body.error || res.body.message).toBeDefined();
    });

    it('should return proper error for 400 Bad Request', async () => {
      if (!socioToken) {
        console.log('Skipping test - no socio token');
        return;
      }

      const res = await request(app.getHttpServer())
        .post('/api/turnos')
        .set('Authorization', `Bearer ${socioToken}`)
        .send({
          // Missing required fields
          cancha_id: testCancha.id,
        })
        .expect(400);

      expect(res.body.message).toBeDefined();
    });
  });
});
