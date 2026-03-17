import * as fc from 'fast-check';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../../app.module';
import { Usuario } from '../../entities/usuario.entity';
import { Cuota } from '../../entities/cuota.entity';
import { PagoCuota } from '../../entities/pago-cuota.entity';
import { Tarifa } from '../../entities/tarifa.entity';
import { CuotasService } from '../cuotas.service';
import { Rol } from '../../common/enums/rol.enum';
import { EstadoCuota } from '../../common/enums/estado-cuota.enum';
import { TipoTarifa } from '../../common/enums/tipo-tarifa.enum';
import { cleanupTestUsers } from '../../__tests__/test-helpers';

/**
 * Feature: gestion-club-tenis, Propiedad 25: Estado de cuota refleja la suma de pagos parciales
 *
 * **Validates: Requerimientos 9.2, 9.3, 9.4**
 *
 * Para cualquier cuota, si la suma de todos sus pagos parciales es menor al monto total,
 * el estado debe ser PENDIENTE o PARCIAL. Si la suma iguala o supera el monto total,
 * el estado debe ser PAGADA.
 */

describe('Feature: gestion-club-tenis, Propiedad 25: Estado de cuota refleja la suma de pagos parciales', () => {
  let app: INestApplication;
  let usuarioRepository: Repository<Usuario>;
  let cuotaRepository: Repository<Cuota>;
  let pagoCuotaRepository: Repository<PagoCuota>;
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
    pagoCuotaRepository = moduleFixture.get<Repository<PagoCuota>>(
      getRepositoryToken(PagoCuota),
    );
    tarifaRepository = moduleFixture.get<Repository<Tarifa>>(
      getRepositoryToken(Tarifa),
    );
    cuotasService = moduleFixture.get<CuotasService>(CuotasService);
  }, 30000);

  beforeEach(async () => {
    // Clean up all test data to ensure clean state
    await pagoCuotaRepository.createQueryBuilder().delete().execute();
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
    'estado de cuota refleja correctamente la suma de pagos parciales',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            // Generate socio data
            socio: fc.record({
              email: fc.uuid().map((id) => `test-socio-${id}@example.com`),
              nombre: fc.stringMatching(/^[A-Za-z]{2,30}$/),
              apellido: fc.stringMatching(/^[A-Za-z]{2,30}$/),
              telefono: fc.stringMatching(/^\d{7,15}$/),
            }),
            // Generate admin data
            admin: fc.record({
              email: fc.uuid().map((id) => `test-admin-${id}@example.com`),
              nombre: fc.stringMatching(/^[A-Za-z]{2,30}$/),
              apellido: fc.stringMatching(/^[A-Za-z]{2,30}$/),
              telefono: fc.stringMatching(/^\d{7,15}$/),
            }),
            // Generate cuota data
            cuotaData: fc.record({
              montoTotal: fc.integer({ min: 1000, max: 50000 }),
              mes: fc.integer({ min: 1, max: 12 }),
              anio: fc.integer({ min: 2024, max: 2025 }),
            }),
            // Generate payment scenarios
            pagos: fc.oneof(
              // Scenario 1: No payments (should remain PENDIENTE)
              fc.constant([]),
              // Scenario 2: Single partial payment
              fc.array(
                fc.record({
                  porcentaje: fc.float({ min: Math.fround(0.1), max: Math.fround(0.8) }),
                }),
                { minLength: 1, maxLength: 1 }
              ),
              // Scenario 3: Multiple partial payments that don't complete
              fc.array(
                fc.record({
                  porcentaje: fc.float({ min: Math.fround(0.05), max: Math.fround(0.3) }),
                }),
                { minLength: 2, maxLength: 4 }
              ).filter(pagos => {
                const totalPorcentaje = pagos.reduce((sum, p) => sum + p.porcentaje, 0);
                return totalPorcentaje < 0.95; // Ensure it doesn't complete the payment
              }),
              // Scenario 4: Payments that exactly complete the cuota
              fc.array(
                fc.record({
                  porcentaje: fc.float({ min: Math.fround(0.1), max: Math.fround(0.4) }),
                }),
                { minLength: 2, maxLength: 5 }
              ).map(pagos => {
                // Adjust last payment to complete exactly
                if (pagos.length > 0) {
                  const sumExceptLast = pagos.slice(0, -1).reduce((sum, p) => sum + p.porcentaje, 0);
                  pagos[pagos.length - 1].porcentaje = Math.max(0.01, 1.0 - sumExceptLast);
                }
                return pagos;
              }),
              // Scenario 5: Payments that exceed the cuota amount
              fc.array(
                fc.record({
                  porcentaje: fc.float({ min: Math.fround(0.2), max: Math.fround(0.6) }),
                }),
                { minLength: 2, maxLength: 3 }
              ).map(pagos => {
                // Adjust last payment to exceed total
                if (pagos.length > 0) {
                  const sumExceptLast = pagos.slice(0, -1).reduce((sum, p) => sum + p.porcentaje, 0);
                  pagos[pagos.length - 1].porcentaje = Math.max(0.01, 1.2 - sumExceptLast);
                }
                return pagos;
              })
            ),
          }),
          async (data) => {
            const createdEmails: string[] = [];
            let tarifa: Tarifa | null = null;
            let socio: Usuario | null = null;
            let admin: Usuario | null = null;
            let cuota: Cuota | null = null;

            try {
              // Step 1: Create tarifa
              tarifa = tarifaRepository.create({
                tipo: TipoTarifa.CUOTA,
                valor: data.cuotaData.montoTotal,
                vigente_desde: new Date(),
              });
              await tarifaRepository.save(tarifa);

              // Step 2: Create socio
              createdEmails.push(data.socio.email);
              socio = usuarioRepository.create({
                nombre: data.socio.nombre,
                apellido: data.socio.apellido,
                email: data.socio.email,
                password_hash: await bcrypt.hash('password123', 10),
                telefono: data.socio.telefono,
                rol: Rol.SOCIO,
                activo: true,
              });
              await usuarioRepository.save(socio);

              // Step 3: Create admin
              createdEmails.push(data.admin.email);
              admin = usuarioRepository.create({
                nombre: data.admin.nombre,
                apellido: data.admin.apellido,
                email: data.admin.email,
                password_hash: await bcrypt.hash('password123', 10),
                telefono: data.admin.telefono,
                rol: Rol.ADMINISTRADOR,
                activo: true,
              });
              await usuarioRepository.save(admin);

              // Step 4: Create cuota
              cuota = cuotaRepository.create({
                socio_id: socio.id,
                mes: data.cuotaData.mes,
                anio: data.cuotaData.anio,
                monto_total: data.cuotaData.montoTotal,
                monto_abonado: 0,
                estado: EstadoCuota.PENDIENTE,
              });
              await cuotaRepository.save(cuota);

              // Step 5: Process payments and verify state transitions
              let totalPagado = 0;
              let expectedEstado = EstadoCuota.PENDIENTE;

              for (let i = 0; i < data.pagos.length; i++) {
                const pago = data.pagos[i];
                let montoPago = Math.round(data.cuotaData.montoTotal * pago.porcentaje);
                
                // Skip if payment would be 0 or negative
                if (montoPago <= 0) continue;

                // Ensure payment doesn't exceed remaining balance
                const saldoPendiente = data.cuotaData.montoTotal - totalPagado;
                if (montoPago > saldoPendiente) {
                  montoPago = saldoPendiente;
                }

                // Skip if no payment to make
                if (montoPago <= 0) continue;

                // Register payment through service
                const result = await cuotasService.registrarPago(
                  cuota.id,
                  { monto: montoPago },
                  admin.id
                );

                totalPagado += montoPago;

                // Determine expected state based on total paid
                if (totalPagado >= data.cuotaData.montoTotal) {
                  expectedEstado = EstadoCuota.PAGADA;
                } else if (totalPagado > 0) {
                  expectedEstado = EstadoCuota.PARCIAL;
                } else {
                  expectedEstado = EstadoCuota.PENDIENTE;
                }

                // Verify the service response
                expect(result.cuota.estado).toBe(expectedEstado);
                expect(result.cuota.monto_abonado).toBe(totalPagado);
                expect(result.cuota.saldo_pendiente).toBe(
                  Math.max(0, data.cuotaData.montoTotal - totalPagado)
                );

                // Verify database state
                const cuotaFromDb = await cuotaRepository.findOne({
                  where: { id: cuota.id },
                });
                expect(cuotaFromDb).toBeTruthy();
                expect(cuotaFromDb!.estado).toBe(expectedEstado);
                expect(Number(cuotaFromDb!.monto_abonado)).toBe(totalPagado);

                // Verify payment was recorded
                const pagosFromDb = await pagoCuotaRepository.find({
                  where: { cuota_id: cuota.id },
                });
                expect(pagosFromDb.length).toBe(i + 1);

                // Verify sum of payments matches monto_abonado
                const sumaPagos = pagosFromDb.reduce(
                  (sum, p) => sum + Number(p.monto),
                  0
                );
                expect(sumaPagos).toBe(totalPagado);

                // Stop if cuota is fully paid
                if (totalPagado >= data.cuotaData.montoTotal) {
                  break;
                }
              }

              // Final verification: Check consistency between payments and cuota state
              const finalCuota = await cuotaRepository.findOne({
                where: { id: cuota.id },
              });
              const finalPagos = await pagoCuotaRepository.find({
                where: { cuota_id: cuota.id },
              });

              const sumaPagosFinal = finalPagos.reduce(
                (sum, p) => sum + Number(p.monto),
                0
              );

              expect(Number(finalCuota!.monto_abonado)).toBe(sumaPagosFinal);

              // Verify state logic
              if (sumaPagosFinal >= data.cuotaData.montoTotal) {
                expect(finalCuota!.estado).toBe(EstadoCuota.PAGADA);
              } else if (sumaPagosFinal > 0) {
                expect(finalCuota!.estado).toBe(EstadoCuota.PARCIAL);
              } else {
                expect(finalCuota!.estado).toBe(EstadoCuota.PENDIENTE);
              }

            } finally {
              // Cleanup in correct order to avoid FK constraint violations
              if (cuota) {
                await pagoCuotaRepository.delete({ cuota_id: cuota.id });
                await cuotaRepository.delete({ id: cuota.id });
              }
              
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

  it(
    'pagos que exceden el saldo pendiente son rechazados',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            socio: fc.record({
              email: fc.uuid().map((id) => `test-socio-excess-${id}@example.com`),
              nombre: fc.stringMatching(/^[A-Za-z]{2,30}$/),
              apellido: fc.stringMatching(/^[A-Za-z]{2,30}$/),
              telefono: fc.stringMatching(/^\d{7,15}$/),
            }),
            admin: fc.record({
              email: fc.uuid().map((id) => `test-admin-excess-${id}@example.com`),
              nombre: fc.stringMatching(/^[A-Za-z]{2,30}$/),
              apellido: fc.stringMatching(/^[A-Za-z]{2,30}$/),
              telefono: fc.stringMatching(/^\d{7,15}$/),
            }),
            montoTotal: fc.integer({ min: 1000, max: 10000 }),
            pagoInicial: fc.float({ min: Math.fround(0.3), max: Math.fround(0.7) }),
            excesoFactor: fc.float({ min: Math.fround(1.1), max: Math.fround(2.0) }),
          }),
          async (data) => {
            const createdEmails: string[] = [];
            let tarifa: Tarifa | null = null;
            let socio: Usuario | null = null;
            let admin: Usuario | null = null;
            let cuota: Cuota | null = null;

            try {
              // Setup
              tarifa = tarifaRepository.create({
                tipo: TipoTarifa.CUOTA,
                valor: data.montoTotal,
                vigente_desde: new Date(),
              });
              await tarifaRepository.save(tarifa);

              createdEmails.push(data.socio.email);
              socio = usuarioRepository.create({
                nombre: data.socio.nombre,
                apellido: data.socio.apellido,
                email: data.socio.email,
                password_hash: await bcrypt.hash('password123', 10),
                telefono: data.socio.telefono,
                rol: Rol.SOCIO,
                activo: true,
              });
              await usuarioRepository.save(socio);

              createdEmails.push(data.admin.email);
              admin = usuarioRepository.create({
                nombre: data.admin.nombre,
                apellido: data.admin.apellido,
                email: data.admin.email,
                password_hash: await bcrypt.hash('password123', 10),
                telefono: data.admin.telefono,
                rol: Rol.ADMINISTRADOR,
                activo: true,
              });
              await usuarioRepository.save(admin);

              cuota = cuotaRepository.create({
                socio_id: socio.id,
                mes: 1,
                anio: 2024,
                monto_total: data.montoTotal,
                monto_abonado: 0,
                estado: EstadoCuota.PENDIENTE,
              });
              await cuotaRepository.save(cuota);

              // Make initial partial payment
              const pagoInicial = Math.round(data.montoTotal * data.pagoInicial);
              await cuotasService.registrarPago(
                cuota.id,
                { monto: pagoInicial },
                admin.id
              );

              // Try to make payment that exceeds remaining balance
              const saldoPendiente = data.montoTotal - pagoInicial;
              const pagoExcesivo = Math.round(saldoPendiente * data.excesoFactor);

              // This should throw an error
              await expect(
                cuotasService.registrarPago(
                  cuota.id,
                  { monto: pagoExcesivo },
                  admin.id
                )
              ).rejects.toThrow();

              // Verify cuota state hasn't changed
              const cuotaFinal = await cuotaRepository.findOne({
                where: { id: cuota.id },
              });
              expect(Number(cuotaFinal!.monto_abonado)).toBe(pagoInicial);
              expect(cuotaFinal!.estado).toBe(EstadoCuota.PARCIAL);

            } finally {
              // Cleanup
              if (cuota) {
                await pagoCuotaRepository.delete({ cuota_id: cuota.id });
                await cuotaRepository.delete({ id: cuota.id });
              }
              
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
    60000,
  );
});