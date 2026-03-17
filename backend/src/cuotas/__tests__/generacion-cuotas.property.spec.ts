import * as fc from 'fast-check';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../../app.module';
import { Usuario } from '../../entities/usuario.entity';
import { Cuota } from '../../entities/cuota.entity';
import { Tarifa } from '../../entities/tarifa.entity';
import { CuotasService } from '../cuotas.service';
import { Rol } from '../../common/enums/rol.enum';
import { EstadoCuota } from '../../common/enums/estado-cuota.enum';
import { TipoTarifa } from '../../common/enums/tipo-tarifa.enum';
import { cleanupTestUsers } from '../../__tests__/test-helpers';

/**
 * Feature: gestion-club-tenis, Propiedad 24: Generación de cuotas cubre todos los socios activos
 *
 * **Validates: Requerimiento 9.1**
 *
 * Para cualquier ejecución del proceso de generación mensual de cuotas, todos los socios activos
 * en ese momento deben tener exactamente una cuota generada para el mes en curso, y ningún socio
 * inactivo debe recibir cuota.
 */

describe('Feature: gestion-club-tenis, Propiedad 24: Generación de cuotas cubre todos los socios activos', () => {
  let app: INestApplication;
  let usuarioRepository: Repository<Usuario>;
  let cuotaRepository: Repository<Cuota>;
  let tarifaRepository: Repository<Tarifa>;
  let cuotasService: CuotasService;

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
    cuotaRepository = moduleFixture.get<Repository<Cuota>>(
      getRepositoryToken(Cuota),
    );
    tarifaRepository = moduleFixture.get<Repository<Tarifa>>(
      getRepositoryToken(Tarifa),
    );
    cuotasService = moduleFixture.get<CuotasService>(CuotasService);
  }, 30000);

  beforeEach(async () => {
    // Clean up all test data to ensure clean state
    await cuotaRepository.createQueryBuilder().delete().execute();
    await cleanupTestUsers(usuarioRepository);
    await tarifaRepository.createQueryBuilder().delete().execute();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  }, 30000);

  it(
    'generación de cuotas cubre todos los socios activos y excluye inactivos y no-socios',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            // Generate different types of users
            sociosActivos: fc.array(
              fc.record({
                email: fc.uuid().map((id) => `test-socio-activo-${id}@example.com`),
                nombre: fc.stringMatching(/^[A-Za-z]{2,30}$/),
                apellido: fc.stringMatching(/^[A-Za-z]{2,30}$/),
                telefono: fc.stringMatching(/^\d{7,15}$/),
              }),
              { minLength: 1, maxLength: 5 }
            ),
            sociosInactivos: fc.array(
              fc.record({
                email: fc.uuid().map((id) => `test-socio-inactivo-${id}@example.com`),
                nombre: fc.stringMatching(/^[A-Za-z]{2,30}$/),
                apellido: fc.stringMatching(/^[A-Za-z]{2,30}$/),
                telefono: fc.stringMatching(/^\d{7,15}$/),
              }),
              { minLength: 0, maxLength: 3 }
            ),
            noSocios: fc.array(
              fc.record({
                email: fc.uuid().map((id) => `test-no-socio-${id}@example.com`),
                nombre: fc.stringMatching(/^[A-Za-z]{2,30}$/),
                apellido: fc.stringMatching(/^[A-Za-z]{2,30}$/),
                telefono: fc.stringMatching(/^\d{7,15}$/),
              }),
              { minLength: 0, maxLength: 3 }
            ),
            administradores: fc.array(
              fc.record({
                email: fc.uuid().map((id) => `test-admin-${id}@example.com`),
                nombre: fc.stringMatching(/^[A-Za-z]{2,30}$/),
                apellido: fc.stringMatching(/^[A-Za-z]{2,30}$/),
                telefono: fc.stringMatching(/^\d{7,15}$/),
              }),
              { minLength: 0, maxLength: 2 }
            ),
            tarifaValor: fc.integer({ min: 1000, max: 50000 }),
          }),
          async (data) => {
            const createdEmails: string[] = [];
            let tarifa: Tarifa | null = null;

            try {
              // Step 1: Create tarifa for cuotas
              tarifa = tarifaRepository.create({
                tipo: TipoTarifa.CUOTA,
                valor: data.tarifaValor,
                vigente_desde: new Date(),
              });
              await tarifaRepository.save(tarifa);

              // Step 2: Create users of different types
              const allUsers: Usuario[] = [];

              // Create active socios
              for (const socioData of data.sociosActivos) {
                createdEmails.push(socioData.email);
                const socio = usuarioRepository.create({
                  nombre: socioData.nombre,
                  apellido: socioData.apellido,
                  email: socioData.email,
                  password_hash: await bcrypt.hash('password123', 10),
                  telefono: socioData.telefono,
                  rol: Rol.SOCIO,
                  activo: true,
                });
                allUsers.push(socio);
              }

              // Create inactive socios
              for (const socioData of data.sociosInactivos) {
                createdEmails.push(socioData.email);
                const socio = usuarioRepository.create({
                  nombre: socioData.nombre,
                  apellido: socioData.apellido,
                  email: socioData.email,
                  password_hash: await bcrypt.hash('password123', 10),
                  telefono: socioData.telefono,
                  rol: Rol.SOCIO,
                  activo: false, // Inactive
                });
                allUsers.push(socio);
              }

              // Create no_socios (active)
              for (const noSocioData of data.noSocios) {
                createdEmails.push(noSocioData.email);
                const noSocio = usuarioRepository.create({
                  nombre: noSocioData.nombre,
                  apellido: noSocioData.apellido,
                  email: noSocioData.email,
                  password_hash: await bcrypt.hash('password123', 10),
                  telefono: noSocioData.telefono,
                  rol: Rol.NO_SOCIO,
                  activo: true,
                });
                allUsers.push(noSocio);
              }

              // Create administradores (active)
              for (const adminData of data.administradores) {
                createdEmails.push(adminData.email);
                const admin = usuarioRepository.create({
                  nombre: adminData.nombre,
                  apellido: adminData.apellido,
                  email: adminData.email,
                  password_hash: await bcrypt.hash('password123', 10),
                  telefono: adminData.telefono,
                  rol: Rol.ADMINISTRADOR,
                  activo: true,
                });
                allUsers.push(admin);
              }

              await usuarioRepository.save(allUsers);

              // Step 3: Execute the cuotas generation method
              await cuotasService.generarCuotasMensuales();

              // Step 4: Verify results
              const now = new Date();
              const currentMonth = now.getMonth() + 1;
              const currentYear = now.getFullYear();

              // Get all generated cuotas for current month/year
              const generatedCuotas = await cuotaRepository.find({
                where: {
                  mes: currentMonth,
                  anio: currentYear,
                },
                relations: ['socio'],
              });

              // Test 1: Verify exactly one cuota per active socio
              expect(generatedCuotas.length).toBe(data.sociosActivos.length);

              // Test 2: Verify all active socios have a cuota
              const sociosWithCuotas = generatedCuotas.map(c => c.socio_id);
              const activeSocioIds = allUsers
                .filter(u => u.rol === Rol.SOCIO && u.activo)
                .map(u => u.id);

              expect(sociosWithCuotas.sort()).toEqual(activeSocioIds.sort());

              // Test 3: Verify no cuotas for inactive socios
              const inactiveSocioIds = allUsers
                .filter(u => u.rol === Rol.SOCIO && !u.activo)
                .map(u => u.id);

              for (const inactiveSocioId of inactiveSocioIds) {
                expect(sociosWithCuotas).not.toContain(inactiveSocioId);
              }

              // Test 4: Verify no cuotas for no_socios
              const noSocioIds = allUsers
                .filter(u => u.rol === Rol.NO_SOCIO)
                .map(u => u.id);

              for (const noSocioId of noSocioIds) {
                expect(sociosWithCuotas).not.toContain(noSocioId);
              }

              // Test 5: Verify no cuotas for administradores
              const adminIds = allUsers
                .filter(u => u.rol === Rol.ADMINISTRADOR)
                .map(u => u.id);

              for (const adminId of adminIds) {
                expect(sociosWithCuotas).not.toContain(adminId);
              }

              // Test 6: Verify cuota properties are correct
              for (const cuota of generatedCuotas) {
                expect(cuota.mes).toBe(currentMonth);
                expect(cuota.anio).toBe(currentYear);
                expect(Number(cuota.monto_total)).toBe(data.tarifaValor);
                expect(Number(cuota.monto_abonado)).toBe(0);
                expect(cuota.estado).toBe(EstadoCuota.PENDIENTE);
                expect(cuota.socio.rol).toBe(Rol.SOCIO);
                expect(cuota.socio.activo).toBe(true);
              }

              // Test 7: Verify no duplicate cuotas (run generation again)
              await cuotasService.generarCuotasMensuales();
              
              const cuotasAfterSecondRun = await cuotaRepository.find({
                where: {
                  mes: currentMonth,
                  anio: currentYear,
                },
              });

              // Should still be the same number (no duplicates)
              expect(cuotasAfterSecondRun.length).toBe(data.sociosActivos.length);

            } finally {
              // Cleanup in correct order to avoid FK constraint violations
              await cuotaRepository.createQueryBuilder().delete().execute();
              
              for (const email of createdEmails) {
                await usuarioRepository.delete({ email });
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