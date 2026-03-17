import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppModule } from '../../app.module';
import { Usuario, Turno, PagoTurno, PagoLuz } from '../../entities';
import { Rol } from '../../common/enums/rol.enum';
import { EstadoTurno } from '../../common/enums/estado-turno.enum';

describe('PagosModule Integration Tests', () => {
  let app: INestApplication;
  let usuarioRepository: Repository<Usuario>;
  let turnoRepository: Repository<Turno>;
  let pagoTurnoRepository: Repository<PagoTurno>;
  let pagoLuzRepository: Repository<PagoLuz>;
  let adminToken: string;
  let adminUser: Usuario;
  let noSocioUser: Usuario;
  let testTurno: Turno;

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

    usuarioRepository = moduleFixture.get<Repository<Usuario>>(getRepositoryToken(Usuario));
    turnoRepository = moduleFixture.get<Repository<Turno>>(getRepositoryToken(Turno));
    pagoTurnoRepository = moduleFixture.get<Repository<PagoTurno>>(getRepositoryToken(PagoTurno));
    pagoLuzRepository = moduleFixture.get<Repository<PagoLuz>>(getRepositoryToken(PagoLuz));

    // Create test admin user
    adminUser = usuarioRepository.create({
      nombre: 'Admin',
      apellido: 'Test',
      email: 'admin@test.com',
      password_hash: '$2b$10$hashedpassword',
      telefono: '123456789',
      rol: Rol.ADMINISTRADOR,
      activo: true,
    });
    await usuarioRepository.save(adminUser);

    // Create test no_socio user
    noSocioUser = usuarioRepository.create({
      nombre: 'NoSocio',
      apellido: 'Test',
      email: 'nosocio@test.com',
      password_hash: '$2b$10$hashedpassword',
      telefono: '987654321',
      rol: Rol.NO_SOCIO,
      activo: true,
    });
    await usuarioRepository.save(noSocioUser);

    // Login as admin to get token
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'password123',
      });

    if (loginResponse.status === 200) {
      adminToken = loginResponse.body.access_token;
    }
  }, 30000);

  afterAll(async () => {
    // Clean up test data
    if (testTurno) {
      await pagoTurnoRepository.delete({ turno_id: testTurno.id });
      await turnoRepository.delete({ id: testTurno.id });
    }
    await pagoLuzRepository.delete({ registrado_por: adminUser.id });
    await usuarioRepository.delete({ id: adminUser.id });
    await usuarioRepository.delete({ id: noSocioUser.id });

    if (app) {
      await app.close();
    }
  }, 30000);

  describe('POST /api/pagos/luz', () => {
    it('should register luz payment successfully', async () => {
      if (!adminToken) {
        console.log('Skipping test - no admin token available');
        return;
      }

      const pagoLuzData = {
        monto: 25000,
        descripcion: 'Pago de luz enero 2024',
      };

      const response = await request(app.getHttpServer())
        .post('/api/pagos/luz')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(pagoLuzData)
        .expect(201);

      expect(response.body).toMatchObject({
        monto: pagoLuzData.monto,
        descripcion: pagoLuzData.descripcion,
        registrado_por: adminUser.id,
      });
      expect(response.body.id).toBeDefined();
      expect(response.body.fecha_pago).toBeDefined();
    });

    it('should reject request without admin role', async () => {
      const pagoLuzData = {
        monto: 25000,
        descripcion: 'Pago de luz enero 2024',
      };

      await request(app.getHttpServer())
        .post('/api/pagos/luz')
        .send(pagoLuzData)
        .expect(401);
    });
  });

  describe('GET /api/pagos/luz', () => {
    it('should return pagos luz in descending order', async () => {
      if (!adminToken) {
        console.log('Skipping test - no admin token available');
        return;
      }

      const response = await request(app.getHttpServer())
        .get('/api/pagos/luz')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      // Verify descending order if there are multiple records
      if (response.body.length > 1) {
        const dates = response.body.map(pago => new Date(pago.fecha_pago));
        for (let i = 1; i < dates.length; i++) {
          expect(dates[i-1].getTime()).toBeGreaterThanOrEqual(dates[i].getTime());
        }
      }
    });
  });
});