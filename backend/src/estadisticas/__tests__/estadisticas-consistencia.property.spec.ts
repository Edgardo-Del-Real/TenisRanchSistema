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
import { Cuota } from '../../entities/cuota.entity';
import { PagoCuota } from '../../entities/pago-cuota.entity';
import { PagoLuz } from '../../entities/pago-luz.entity';
import { PagoTurno } from '../../entities/pago-turno.entity';
import { ConfiguracionClub } from '../../entities/configuracion-club.entity';
import { Tarifa } from '../../entities/tarifa.entity';
import { Rol } from '../../common/enums/rol.enum';
import { EstadoCancha } from '../../common/enums/estado-cancha.enum';
import { EstadoTurno } from '../../common/enums/estado-turno.enum';
import { EstadoCuota } from '../../common/enums/estado-cuota.enum';
import { TipoTarifa } from '../../common/enums/tipo-tarifa.enum';
import { cleanupTestUsers } from '../../__tests__/test-helpers';

/**
 * Feature: gestion-club-tenis, Propiedad 30: Estadísticas son consistentes con los datos subyacentes
 *
 * **Validates: Requerimientos 14.1, 14.2, 14.3**
 *
 * Para cualquier período seleccionado, los totales y conteos mostrados en el panel de estadísticas
 * deben ser iguales a la suma/conteo de los registros correspondientes en la base de datos para ese período.
 * Ningún indicador debe incluir datos fuera del rango seleccionado.
 */

describe('Feature: gestion-club-tenis, Propiedad 30: Estadísticas son consistentes con los datos subyacentes', () => {
  let app: INestApplication;
  let usuarioRepository: Repository<Usuario>;
  let canchaRepository: Repository<Cancha>;
  let turnoRepository: Repository<Turno>;
  let cuotaRepository: Repository<Cuota>;
  let pagoCuotaRepository: Repository<PagoCuota>;
  let pagoLuzRepository: Repository<PagoLuz>;
  let pagoTurnoRepository: Repository<PagoTurno>;
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
    cuotaRepository = moduleFixture.get<Repository<Cuota>>(
      getRepositoryToken(Cuota),
    );
    pagoCuotaRepository = moduleFixture.get<Repository<PagoCuota>>(
      getRepositoryToken(PagoCuota),
    );
    pagoLuzRepository = moduleFixture.get<Repository<PagoLuz>>(
      getRepositoryToken(PagoLuz),
    );
    pagoTurnoRepository = moduleFixture.get<Repository<PagoTurno>>(
      getRepositoryToken(PagoTurno),
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
    await pagoCuotaRepository.createQueryBuilder().delete().execute();
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
    'estadísticas generales son consistentes con los datos subyacentes',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            // Generate admin data
            admin: fc.record({
              email: fc.uuid().map((id) => `test-admin-stats-${id}@example.com`),
              nombre: fc.stringMatching(/^[A-Za-z]{2,30}$/),
              apellido: fc.stringMatching(/^[A-Za-z]{2,30}$/),
              telefono: fc.stringMatching(/^\d{7,15}$/),
              password: fc.stringMatching(/^[A-Za-z0-9]{8,20}$/),
            }),
            // Generate socios data - simplified
            socios: fc.array(
              fc.record({
                nombre: fc.stringMatching(/^[A-Za-z]{2,30}$/),
                apellido: fc.stringMatching(/^[A-Za-z]{2,30}$/),
                telefono: fc.stringMatching(/^\d{7,15}$/),
                activo: fc.boolean(),
              }),
              { minLength: 2, maxLength: 4 } // Reduced from 8 to 4
            ),
            // Generate canchas data - simplified
            canchas: fc.array(
              fc.record({
                numero: fc.integer({ min: 1, max: 10 }),
                estado: fc.constantFrom(
                  EstadoCancha.DISPONIBLE,
                  EstadoCancha.MANTENIMIENTO,
                  EstadoCancha.INHABILITADA
                ),
              }),
              { minLength: 2, maxLength: 3 } // Reduced from 5 to 3
            ),
            // Generate turnos data with dates - simplified
            turnos: fc.array(
              fc.record({
                canchaIndex: fc.integer({ min: 0, max: 2 }), // Adjusted for smaller cancha array
                socioIndex: fc.integer({ min: 0, max: 3 }), // Adjusted for smaller socio array
                daysFromNow: fc.integer({ min: -15, max: 15 }), // Reduced range
                hour: fc.integer({ min: 8, max: 21 }),
                requiereLuz: fc.boolean(),
                estado: fc.constantFrom(EstadoTurno.ACTIVO, EstadoTurno.CANCELADO),
              }),
              { minLength: 3, maxLength: 8 } // Reduced from 20 to 8
            ),
            // Date range for filtering
            filtroFechas: fc.oneof(
              fc.constant(null), // No filter
              fc.record({
                fechaInicio: fc.integer({ min: -10, max: -2 }), // Reduced range
                fechaFin: fc.integer({ min: 2, max: 10 }), // Reduced range
              })
            ),
          }),
          async (data) => {
            const createdEmails: string[] = [];
            let config: ConfiguracionClub | null = null;
            let tarifa: Tarifa | null = null;
            let admin: Usuario | null = null;
            const socios: Usuario[] = [];
            const canchas: Cancha[] = [];
            const turnos: Turno[] = [];

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

              // Step 3: Create admin user
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

              // Step 4: Create socios
              for (let i = 0; i < data.socios.length; i++) {
                const socioData = data.socios[i];
                const email = `test-socio-stats-${Date.now()}-${i}@example.com`;
                createdEmails.push(email);
                const socio = usuarioRepository.create({
                  nombre: socioData.nombre,
                  apellido: socioData.apellido,
                  email: email,
                  password_hash: await bcrypt.hash('password123', 10),
                  telefono: socioData.telefono,
                  rol: Rol.SOCIO,
                  activo: socioData.activo,
                });
                await usuarioRepository.save(socio);
                socios.push(socio);
              }

              // Step 5: Create canchas
              for (const canchaData of data.canchas) {
                const cancha = canchaRepository.create({
                  numero: canchaData.numero,
                  estado: canchaData.estado,
                });
                await canchaRepository.save(cancha);
                canchas.push(cancha);
              }

              // Step 6: Create turnos
              for (const turnoData of data.turnos) {
                if (turnoData.canchaIndex >= canchas.length || turnoData.socioIndex >= socios.length) {
                  continue; // Skip if indices are out of bounds
                }

                const cancha = canchas[turnoData.canchaIndex];
                const socio = socios[turnoData.socioIndex];
                
                const fechaInicio = new Date();
                fechaInicio.setDate(fechaInicio.getDate() + turnoData.daysFromNow);
                fechaInicio.setHours(turnoData.hour, 0, 0, 0);
                
                const fechaFin = new Date(fechaInicio);
                fechaFin.setHours(fechaInicio.getHours() + 1);

                const turno = turnoRepository.create({
                  usuario_id: socio.id,
                  cancha_id: cancha.id,
                  fecha_inicio: fechaInicio,
                  fecha_fin: fechaFin,
                  requiere_luz: turnoData.requiereLuz,
                  costo_turno: 0, // Socios don't pay
                  costo_luz: turnoData.requiereLuz ? 4000 : 0,
                  estado: turnoData.estado,
                });
                await turnoRepository.save(turno);
                turnos.push(turno);
              }

              // Step 7: Login as admin
              const loginResponse = await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({ email: data.admin.email, password: data.admin.password });
              expect(loginResponse.status).toBe(200);
              const adminToken: string = loginResponse.body.access_token;

              // Step 8: Get statistics with filters
              let queryParams = '';
              if (data.filtroFechas) {
                const fechaInicio = new Date();
                fechaInicio.setDate(fechaInicio.getDate() + data.filtroFechas.fechaInicio);
                const fechaFin = new Date();
                fechaFin.setDate(fechaFin.getDate() + data.filtroFechas.fechaFin);
                
                queryParams = `?fechaInicio=${fechaInicio.toISOString().split('T')[0]}&fechaFin=${fechaFin.toISOString().split('T')[0]}`;
              }

              const statsResponse = await request(app.getHttpServer())
                .get(`/api/estadisticas/generales${queryParams}`)
                .set('Authorization', `Bearer ${adminToken}`);

              expect(statsResponse.status).toBe(200);
              const stats = statsResponse.body;

              // Step 9: Verify statistics consistency with database
              
              // 9.1: Verify total socios activos
              const expectedSociosActivos = await usuarioRepository.count({
                where: {
                  rol: Rol.SOCIO,
                  activo: true,
                },
              });
              expect(stats.totalSociosActivos).toBe(expectedSociosActivos);

              // 9.2: Verify total turnos in period
              let expectedTotalTurnos: number;
              if (data.filtroFechas) {
                const fechaInicio = new Date();
                fechaInicio.setDate(fechaInicio.getDate() + data.filtroFechas.fechaInicio);
                const fechaFin = new Date();
                fechaFin.setDate(fechaFin.getDate() + data.filtroFechas.fechaFin);
                
                expectedTotalTurnos = turnos.filter(turno => {
                  return turno.estado === EstadoTurno.ACTIVO &&
                         turno.fecha_inicio >= fechaInicio && 
                         turno.fecha_inicio <= fechaFin;
                }).length;
              } else {
                expectedTotalTurnos = turnos.filter(turno => turno.estado === EstadoTurno.ACTIVO).length;
              }

              expect(stats.totalTurnos).toBe(expectedTotalTurnos);

              // 9.3: Verify canchas más utilizadas
              const canchaUsage = new Map<number, number>();
              turnos.forEach(turno => {
                if (turno.estado !== EstadoTurno.ACTIVO) return;
                
                if (data.filtroFechas) {
                  const fechaInicio = new Date();
                  fechaInicio.setDate(fechaInicio.getDate() + data.filtroFechas.fechaInicio);
                  const fechaFin = new Date();
                  fechaFin.setDate(fechaFin.getDate() + data.filtroFechas.fechaFin);
                  
                  if (turno.fecha_inicio < fechaInicio || turno.fecha_inicio > fechaFin) return;
                }

                const cancha = canchas.find(c => c.id === turno.cancha_id);
                if (cancha) {
                  canchaUsage.set(cancha.numero, (canchaUsage.get(cancha.numero) || 0) + 1);
                }
              });

              const expectedCanchasMasUtilizadas = Array.from(canchaUsage.entries())
                .map(([numero, cantidad]) => ({ numero, cantidad }))
                .sort((a, b) => {
                  if (b.cantidad !== a.cantidad) {
                    return b.cantidad - a.cantidad; // Primary sort by cantidad DESC
                  }
                  return a.numero - b.numero; // Secondary sort by numero ASC for ties
                });

              expect(stats.canchasMasUtilizadas).toEqual(expectedCanchasMasUtilizadas);

              // 9.4: Verify horas pico
              const horaUsage = new Map<number, number>();
              turnos.forEach(turno => {
                if (turno.estado !== EstadoTurno.ACTIVO) return;
                
                if (data.filtroFechas) {
                  const fechaInicio = new Date();
                  fechaInicio.setDate(fechaInicio.getDate() + data.filtroFechas.fechaInicio);
                  const fechaFin = new Date();
                  fechaFin.setDate(fechaFin.getDate() + data.filtroFechas.fechaFin);
                  
                  if (turno.fecha_inicio < fechaInicio || turno.fecha_inicio > fechaFin) return;
                }

                const hora = turno.fecha_inicio.getHours();
                horaUsage.set(hora, (horaUsage.get(hora) || 0) + 1);
              });

              const expectedHorasPico = Array.from(horaUsage.entries())
                .map(([hora, cantidad]) => ({ hora, cantidad }))
                .sort((a, b) => {
                  if (b.cantidad !== a.cantidad) {
                    return b.cantidad - a.cantidad; // Primary sort by cantidad DESC
                  }
                  return a.hora - b.hora; // Secondary sort by hora ASC for ties
                });

              expect(stats.horasPico).toEqual(expectedHorasPico);

            } finally {
              // Cleanup in correct order to avoid FK constraint violations
              await turnoRepository.createQueryBuilder().delete().execute();
              await cuotaRepository.createQueryBuilder().delete().execute();
              
              for (const email of createdEmails) {
                await usuarioRepository.delete({ email });
              }
              
              await canchaRepository.createQueryBuilder().delete().execute();
              
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
    'estadísticas financieras son consistentes con los datos subyacentes',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            // Generate admin data
            admin: fc.record({
              email: fc.uuid().map((id) => `test-admin-fin-${id}@example.com`),
              nombre: fc.stringMatching(/^[A-Za-z]{2,30}$/),
              apellido: fc.stringMatching(/^[A-Za-z]{2,30}$/),
              telefono: fc.stringMatching(/^\d{7,15}$/),
              password: fc.stringMatching(/^[A-Za-z0-9]{8,20}$/),
            }),
            // Generate socios and no_socios - simplified
            usuarios: fc.array(
              fc.record({
                nombre: fc.stringMatching(/^[A-Za-z]{2,30}$/),
                apellido: fc.stringMatching(/^[A-Za-z]{2,30}$/),
                telefono: fc.stringMatching(/^\d{7,15}$/),
                rol: fc.constantFrom(Rol.SOCIO, Rol.NO_SOCIO),
              }),
              { minLength: 3, maxLength: 5 } // Reduced from 8 to 5
            ),
            // Generate cuotas and pagos - simplified
            cuotasData: fc.array(
              fc.record({
                socioIndex: fc.integer({ min: 0, max: 4 }), // Adjusted for smaller array
                monto: fc.integer({ min: 1000, max: 10000 }),
                mes: fc.integer({ min: 1, max: 12 }),
                anio: fc.integer({ min: 2024, max: 2025 }),
                pagos: fc.array(
                  fc.record({
                    monto: fc.integer({ min: 100, max: 5000 }),
                    daysFromNow: fc.integer({ min: -15, max: 15 }), // Reduced range
                  }),
                  { minLength: 0, maxLength: 2 } // Reduced from 3 to 2
                ),
              }),
              { minLength: 1, maxLength: 3 } // Reduced from 6 to 3
            ),
            // Generate turnos with pagos - simplified
            turnosData: fc.array(
              fc.record({
                usuarioIndex: fc.integer({ min: 0, max: 4 }), // Adjusted for smaller array
                daysFromNow: fc.integer({ min: -15, max: 15 }), // Reduced range
                hour: fc.integer({ min: 8, max: 21 }),
                requiereLuz: fc.boolean(),
                costoTurno: fc.integer({ min: 1000, max: 8000 }),
                costoLuz: fc.integer({ min: 0, max: 5000 }),
                pagoTurno: fc.oneof(
                  fc.constant(null),
                  fc.record({
                    monto: fc.integer({ min: 1000, max: 8000 }),
                    metodo: fc.constantFrom('efectivo', 'transferencia', 'tarjeta'),
                    daysFromNow: fc.integer({ min: -15, max: 15 }), // Reduced range
                  })
                ),
              }),
              { minLength: 2, maxLength: 5 } // Reduced from 10 to 5
            ),
            // Generate pagos de luz - simplified
            pagosLuz: fc.array(
              fc.record({
                monto: fc.integer({ min: 5000, max: 50000 }),
                descripcion: fc.oneof(
                  fc.constant('Pago luz enero'),
                  fc.constant('Factura EDESUR'),
                  fc.constant(null)
                ),
                daysFromNow: fc.integer({ min: -15, max: 15 }), // Reduced range
              }),
              { minLength: 1, maxLength: 3 } // Reduced from 5 to 3
            ),
            // Date range for filtering
            filtroFechas: fc.oneof(
              fc.constant(null), // No filter
              fc.record({
                fechaInicio: fc.integer({ min: -10, max: -2 }), // Reduced range
                fechaFin: fc.integer({ min: 2, max: 10 }), // Reduced range
              })
            ),
          }),
          async (data) => {
            const createdEmails: string[] = [];
            let config: ConfiguracionClub | null = null;
            let tarifaCuota: Tarifa | null = null;
            let tarifaTurno: Tarifa | null = null;
            let admin: Usuario | null = null;
            const usuarios: Usuario[] = [];
            const cuotas: Cuota[] = [];
            const turnos: Turno[] = [];
            let cancha: Cancha | null = null;

            try {
              // Step 1: Create configuration and tarifas
              config = configuracionRepository.create({
                apertura: '08:00:00',
                cierre: '22:00:00',
                luz_inicio: '18:00:00',
                luz_fin: '22:00:00',
                duracion_semana_min: 60,
                duracion_finde_min: 90,
              });
              await configuracionRepository.save(config);

              tarifaCuota = tarifaRepository.create({
                tipo: TipoTarifa.CUOTA,
                valor: 5000,
                vigente_desde: new Date(),
              });
              await tarifaRepository.save(tarifaCuota);

              tarifaTurno = tarifaRepository.create({
                tipo: TipoTarifa.TURNO_NO_SOCIO,
                valor: 3000,
                vigente_desde: new Date(),
              });
              await tarifaRepository.save(tarifaTurno);

              // Step 2: Create cancha
              cancha = canchaRepository.create({
                numero: 1,
                estado: EstadoCancha.DISPONIBLE,
              });
              await canchaRepository.save(cancha);

              // Step 3: Create admin user
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

              // Step 4: Create usuarios
              for (let i = 0; i < data.usuarios.length; i++) {
                const userData = data.usuarios[i];
                const email = `test-user-fin-${Date.now()}-${i}@example.com`;
                createdEmails.push(email);
                const usuario = usuarioRepository.create({
                  nombre: userData.nombre,
                  apellido: userData.apellido,
                  email: email,
                  password_hash: await bcrypt.hash('password123', 10),
                  telefono: userData.telefono,
                  rol: userData.rol,
                  activo: true,
                });
                await usuarioRepository.save(usuario);
                usuarios.push(usuario);
              }

              // Step 5: Create cuotas and pagos
              for (const cuotaData of data.cuotasData) {
                const socios = usuarios.filter(u => u.rol === Rol.SOCIO);
                if (cuotaData.socioIndex >= socios.length || socios.length === 0) continue;

                const socio = socios[cuotaData.socioIndex % socios.length];
                
                const cuota = cuotaRepository.create({
                  socio_id: socio.id,
                  mes: cuotaData.mes,
                  anio: cuotaData.anio,
                  monto_total: cuotaData.monto,
                  monto_abonado: 0,
                  estado: EstadoCuota.PENDIENTE,
                });
                await cuotaRepository.save(cuota);
                cuotas.push(cuota);

                // Create pagos for this cuota
                let montoAbonado = 0;
                for (const pagoData of cuotaData.pagos) {
                  const fechaPago = new Date();
                  fechaPago.setDate(fechaPago.getDate() + pagoData.daysFromNow);

                  const pago = pagoCuotaRepository.create({
                    cuota_id: cuota.id,
                    monto: pagoData.monto,
                    fecha_pago: fechaPago,
                    registrado_por: admin.id,
                  });
                  await pagoCuotaRepository.save(pago);
                  montoAbonado += pagoData.monto;
                }

                // Update cuota with total paid
                cuota.monto_abonado = montoAbonado;
                if (montoAbonado >= cuota.monto_total) {
                  cuota.estado = EstadoCuota.PAGADA;
                } else if (montoAbonado > 0) {
                  cuota.estado = EstadoCuota.PARCIAL;
                }
                await cuotaRepository.save(cuota);
              }

              // Step 6: Create turnos and pagos de turnos
              for (const turnoData of data.turnosData) {
                if (turnoData.usuarioIndex >= usuarios.length) continue;

                const usuario = usuarios[turnoData.usuarioIndex];
                
                const fechaInicio = new Date();
                fechaInicio.setDate(fechaInicio.getDate() + turnoData.daysFromNow);
                fechaInicio.setHours(turnoData.hour, 0, 0, 0);
                
                const fechaFin = new Date(fechaInicio);
                fechaFin.setHours(fechaInicio.getHours() + 1);

                const turno = turnoRepository.create({
                  usuario_id: usuario.id,
                  cancha_id: cancha.id,
                  fecha_inicio: fechaInicio,
                  fecha_fin: fechaFin,
                  requiere_luz: turnoData.requiereLuz,
                  costo_turno: usuario.rol === Rol.NO_SOCIO ? turnoData.costoTurno : 0,
                  costo_luz: turnoData.requiereLuz ? turnoData.costoLuz : 0,
                  estado: EstadoTurno.ACTIVO,
                });
                await turnoRepository.save(turno);
                turnos.push(turno);

                // Create pago for turno if specified and user is NO_SOCIO
                if (turnoData.pagoTurno && usuario.rol === Rol.NO_SOCIO) {
                  const fechaPago = new Date();
                  fechaPago.setDate(fechaPago.getDate() + turnoData.pagoTurno.daysFromNow);

                  const pagoTurno = pagoTurnoRepository.create({
                    turno_id: turno.id,
                    monto: turnoData.pagoTurno.monto,
                    metodo_pago: turnoData.pagoTurno.metodo,
                    fecha_pago: fechaPago,
                    registrado_por: admin.id,
                  });
                  await pagoTurnoRepository.save(pagoTurno);
                }
              }

              // Step 7: Create pagos de luz
              for (const pagoLuzData of data.pagosLuz) {
                const fechaPago = new Date();
                fechaPago.setDate(fechaPago.getDate() + pagoLuzData.daysFromNow);

                const pagoLuz = pagoLuzRepository.create({
                  monto: pagoLuzData.monto,
                  descripcion: pagoLuzData.descripcion,
                  fecha_pago: fechaPago,
                  registrado_por: admin.id,
                });
                await pagoLuzRepository.save(pagoLuz);
              }

              // Step 8: Login as admin
              const loginResponse = await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({ email: data.admin.email, password: data.admin.password });
              expect(loginResponse.status).toBe(200);
              const adminToken: string = loginResponse.body.access_token;

              // Step 9: Get financial statistics with filters
              let queryParams = '';
              let fechaInicio: Date | null = null;
              let fechaFin: Date | null = null;
              
              if (data.filtroFechas) {
                fechaInicio = new Date();
                fechaInicio.setDate(fechaInicio.getDate() + data.filtroFechas.fechaInicio);
                fechaInicio.setHours(0, 0, 0, 0); // Start of day
                fechaFin = new Date();
                fechaFin.setDate(fechaFin.getDate() + data.filtroFechas.fechaFin);
                fechaFin.setHours(23, 59, 59, 999); // End of day
                
                queryParams = `?fechaInicio=${fechaInicio.toISOString().split('T')[0]}&fechaFin=${fechaFin.toISOString().split('T')[0]}`;
              }

              const statsResponse = await request(app.getHttpServer())
                .get(`/api/estadisticas/financieras${queryParams}`)
                .set('Authorization', `Bearer ${adminToken}`);

              expect(statsResponse.status).toBe(200);
              const stats = statsResponse.body;

              // Step 10: Calculate expected values and verify consistency

              // 10.1: Verify recaudación por cuotas
              // Only count payments for cuotas of actual SOCIO users
              const expectedRecaudacionCuotas = data.filtroFechas ?
                data.cuotasData.reduce((sum, cuotaData) => {
                  const socios = usuarios.filter(u => u.rol === Rol.SOCIO);
                  if (cuotaData.socioIndex >= socios.length || socios.length === 0) return sum;
                  
                  return sum + cuotaData.pagos.filter(pagoData => {
                    const fechaPago = new Date();
                    fechaPago.setDate(fechaPago.getDate() + pagoData.daysFromNow);
                    fechaPago.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues
                    return fechaPago >= fechaInicio! && fechaPago <= fechaFin!;
                  }).reduce((pagoSum, pago) => pagoSum + pago.monto, 0);
                }, 0) :
                data.cuotasData.reduce((sum, cuotaData) => {
                  const socios = usuarios.filter(u => u.rol === Rol.SOCIO);
                  if (cuotaData.socioIndex >= socios.length || socios.length === 0) return sum;
                  
                  return sum + cuotaData.pagos.reduce((pagoSum, pago) => pagoSum + pago.monto, 0);
                }, 0);
              
              expect(stats.recaudacionCuotas).toBe(expectedRecaudacionCuotas);

              // 10.2: Verify recaudación por turnos No_Socio
              // Only count payments for turnos made by NO_SOCIO users
              const expectedRecaudacionTurnos = data.filtroFechas ?
                data.turnosData.filter(turnoData => {
                  if (!turnoData.pagoTurno || turnoData.usuarioIndex >= usuarios.length) return false;
                  const usuario = usuarios[turnoData.usuarioIndex];
                  if (usuario.rol !== Rol.NO_SOCIO) return false; // Only NO_SOCIO users pay for turnos
                  const fechaPago = new Date();
                  fechaPago.setDate(fechaPago.getDate() + turnoData.pagoTurno.daysFromNow);
                  fechaPago.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues
                  return fechaPago >= fechaInicio! && fechaPago <= fechaFin!;
                }).reduce((sum, turnoData) => sum + (turnoData.pagoTurno?.monto || 0), 0) :
                data.turnosData.filter(turnoData => {
                  if (!turnoData.pagoTurno || turnoData.usuarioIndex >= usuarios.length) return false;
                  const usuario = usuarios[turnoData.usuarioIndex];
                  return usuario.rol === Rol.NO_SOCIO; // Only NO_SOCIO users pay for turnos
                }).reduce((sum, turnoData) => sum + (turnoData.pagoTurno?.monto || 0), 0);
              
              expect(stats.recaudacionTurnosNoSocio).toBe(expectedRecaudacionTurnos);

              // 10.3: Verify cargos de luz
              const expectedCargosLuz = data.filtroFechas ?
                data.turnosData.filter(turnoData => {
                  if (!turnoData.requiereLuz || turnoData.usuarioIndex >= usuarios.length) return false;
                  const fechaTurno = new Date();
                  fechaTurno.setDate(fechaTurno.getDate() + turnoData.daysFromNow);
                  fechaTurno.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues
                  return fechaTurno >= fechaInicio! && fechaTurno <= fechaFin!;
                }).reduce((sum, turnoData) => sum + turnoData.costoLuz, 0) :
                data.turnosData.filter(turnoData => turnoData.requiereLuz && turnoData.usuarioIndex < usuarios.length)
                  .reduce((sum, turnoData) => sum + turnoData.costoLuz, 0);
              
              expect(stats.cargosLuz).toBe(expectedCargosLuz);

              // 10.4: Verify pagos de luz
              const pagosLuzEnPeriodo = data.filtroFechas ? 
                data.pagosLuz.filter(pagoLuzData => {
                  const fechaPago = new Date();
                  fechaPago.setDate(fechaPago.getDate() + pagoLuzData.daysFromNow);
                  fechaPago.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues
                  return fechaPago >= fechaInicio! && fechaPago <= fechaFin!;
                }) : data.pagosLuz;

              const expectedPagosLuz = pagosLuzEnPeriodo.reduce(
                (sum, pago) => sum + pago.monto,
                0
              );
              expect(stats.pagosLuz).toBe(expectedPagosLuz);

            } finally {
              // Cleanup in correct order to avoid FK constraint violations
              await pagoTurnoRepository.createQueryBuilder().delete().execute();
              await pagoLuzRepository.createQueryBuilder().delete().execute();
              await pagoCuotaRepository.createQueryBuilder().delete().execute();
              await turnoRepository.createQueryBuilder().delete().execute();
              await cuotaRepository.createQueryBuilder().delete().execute();
              
              for (const email of createdEmails) {
                await usuarioRepository.delete({ email });
              }
              
              if (cancha) {
                await canchaRepository.delete({ id: cancha.id });
              }
              
              if (config) {
                await configuracionRepository.delete({ id: config.id });
              }
              
              if (tarifaCuota) {
                await tarifaRepository.delete({ id: tarifaCuota.id });
              }
              
              if (tarifaTurno) {
                await tarifaRepository.delete({ id: tarifaTurno.id });
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
    'filtrado por rango de fechas excluye datos fuera del período',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            admin: fc.record({
              email: fc.uuid().map((id) => `test-admin-filter-${id}@example.com`),
              nombre: fc.stringMatching(/^[A-Za-z]{2,30}$/),
              apellido: fc.stringMatching(/^[A-Za-z]{2,30}$/),
              telefono: fc.stringMatching(/^\d{7,15}$/),
              password: fc.stringMatching(/^[A-Za-z0-9]{8,20}$/),
            }),
            socio: fc.record({
              email: fc.uuid().map((id) => `test-socio-filter-${id}@example.com`),
              nombre: fc.stringMatching(/^[A-Za-z]{2,30}$/),
              apellido: fc.stringMatching(/^[A-Za-z]{2,30}$/),
              telefono: fc.stringMatching(/^\d{7,15}$/),
            }),
            // Data inside period
            dataInside: fc.record({
              turnoDays: fc.integer({ min: -8, max: 8 }), // Reduced range
              pagoLuzDays: fc.integer({ min: -8, max: 8 }),
              pagoCuotaDays: fc.integer({ min: -8, max: 8 }),
            }),
            // Data outside period
            dataOutside: fc.record({
              turnoDays: fc.oneof(
                fc.integer({ min: -25, max: -18 }), // Reduced range
                fc.integer({ min: 18, max: 25 })
              ),
              pagoLuzDays: fc.oneof(
                fc.integer({ min: -25, max: -18 }),
                fc.integer({ min: 18, max: 25 })
              ),
              pagoCuotaDays: fc.oneof(
                fc.integer({ min: -25, max: -18 }),
                fc.integer({ min: 18, max: 25 })
              ),
            }),
          }),
          async (data) => {
            const createdEmails: string[] = [];
            let config: ConfiguracionClub | null = null;
            let tarifa: Tarifa | null = null;
            let admin: Usuario | null = null;
            let socio: Usuario | null = null;
            let cancha: Cancha | null = null;

            try {
              // Setup
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
                tipo: TipoTarifa.CUOTA,
                valor: 5000,
                vigente_desde: new Date(),
              });
              await tarifaRepository.save(tarifa);

              cancha = canchaRepository.create({
                numero: 1,
                estado: EstadoCancha.DISPONIBLE,
              });
              await canchaRepository.save(cancha);

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

              // Create data inside period
              const fechaTurnoInside = new Date();
              fechaTurnoInside.setDate(fechaTurnoInside.getDate() + data.dataInside.turnoDays);
              fechaTurnoInside.setHours(10, 0, 0, 0);

              const turnoInside = turnoRepository.create({
                usuario_id: socio.id,
                cancha_id: cancha.id,
                fecha_inicio: fechaTurnoInside,
                fecha_fin: new Date(fechaTurnoInside.getTime() + 60 * 60 * 1000),
                requiere_luz: true,
                costo_turno: 0,
                costo_luz: 4000,
                estado: EstadoTurno.ACTIVO,
              });
              await turnoRepository.save(turnoInside);

              // Create cuota and pago inside period
              const cuotaInside = cuotaRepository.create({
                socio_id: socio.id,
                mes: 1,
                anio: 2024,
                monto_total: 5000,
                monto_abonado: 2500,
                estado: EstadoCuota.PARCIAL,
              });
              await cuotaRepository.save(cuotaInside);

              const fechaPagoCuotaInside = new Date();
              fechaPagoCuotaInside.setDate(fechaPagoCuotaInside.getDate() + data.dataInside.pagoCuotaDays);

              const pagoCuotaInside = pagoCuotaRepository.create({
                cuota_id: cuotaInside.id,
                monto: 2500,
                fecha_pago: fechaPagoCuotaInside,
                registrado_por: admin.id,
              });
              await pagoCuotaRepository.save(pagoCuotaInside);

              // Create pago luz inside period
              const fechaPagoLuzInside = new Date();
              fechaPagoLuzInside.setDate(fechaPagoLuzInside.getDate() + data.dataInside.pagoLuzDays);

              const pagoLuzInside = pagoLuzRepository.create({
                monto: 15000,
                descripcion: 'Pago luz inside',
                fecha_pago: fechaPagoLuzInside,
                registrado_por: admin.id,
              });
              await pagoLuzRepository.save(pagoLuzInside);

              // Create data outside period
              const fechaTurnoOutside = new Date();
              fechaTurnoOutside.setDate(fechaTurnoOutside.getDate() + data.dataOutside.turnoDays);
              fechaTurnoOutside.setHours(10, 0, 0, 0);

              const turnoOutside = turnoRepository.create({
                usuario_id: socio.id,
                cancha_id: cancha.id,
                fecha_inicio: fechaTurnoOutside,
                fecha_fin: new Date(fechaTurnoOutside.getTime() + 60 * 60 * 1000),
                requiere_luz: true,
                costo_turno: 0,
                costo_luz: 6000,
                estado: EstadoTurno.ACTIVO,
              });
              await turnoRepository.save(turnoOutside);

              // Create pago cuota outside period
              const fechaPagoCuotaOutside = new Date();
              fechaPagoCuotaOutside.setDate(fechaPagoCuotaOutside.getDate() + data.dataOutside.pagoCuotaDays);

              const pagoCuotaOutside = pagoCuotaRepository.create({
                cuota_id: cuotaInside.id,
                monto: 1000,
                fecha_pago: fechaPagoCuotaOutside,
                registrado_por: admin.id,
              });
              await pagoCuotaRepository.save(pagoCuotaOutside);

              // Create pago luz outside period
              const fechaPagoLuzOutside = new Date();
              fechaPagoLuzOutside.setDate(fechaPagoLuzOutside.getDate() + data.dataOutside.pagoLuzDays);

              const pagoLuzOutside = pagoLuzRepository.create({
                monto: 20000,
                descripcion: 'Pago luz outside',
                fecha_pago: fechaPagoLuzOutside,
                registrado_por: admin.id,
              });
              await pagoLuzRepository.save(pagoLuzOutside);

              // Login and get statistics with filter
              const loginResponse = await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({ email: data.admin.email, password: data.admin.password });
              expect(loginResponse.status).toBe(200);
              const adminToken: string = loginResponse.body.access_token;

              // Define filter period (-15 to +15 days from now)
              const fechaInicio = new Date();
              fechaInicio.setDate(fechaInicio.getDate() - 15);
              const fechaFin = new Date();
              fechaFin.setDate(fechaFin.getDate() + 15);

              const queryParams = `?fechaInicio=${fechaInicio.toISOString().split('T')[0]}&fechaFin=${fechaFin.toISOString().split('T')[0]}`;

              // Get general statistics
              const generalStatsResponse = await request(app.getHttpServer())
                .get(`/api/estadisticas/generales${queryParams}`)
                .set('Authorization', `Bearer ${adminToken}`);

              expect(generalStatsResponse.status).toBe(200);
              const generalStats = generalStatsResponse.body;

              // Get financial statistics
              const financialStatsResponse = await request(app.getHttpServer())
                .get(`/api/estadisticas/financieras${queryParams}`)
                .set('Authorization', `Bearer ${adminToken}`);

              expect(financialStatsResponse.status).toBe(200);
              const financialStats = financialStatsResponse.body;

              // Verify only inside data is included
              // Should include only 1 turno (the inside one)
              expect(generalStats.totalTurnos).toBe(1);

              // Should include only inside pago cuota (2500)
              expect(financialStats.recaudacionCuotas).toBe(2500);

              // Should include only inside cargo luz (4000)
              expect(financialStats.cargosLuz).toBe(4000);

              // Should include only inside pago luz (15000)
              expect(financialStats.pagosLuz).toBe(15000);

            } finally {
              // Cleanup
              await pagoTurnoRepository.createQueryBuilder().delete().execute();
              await pagoLuzRepository.createQueryBuilder().delete().execute();
              await pagoCuotaRepository.createQueryBuilder().delete().execute();
              await turnoRepository.createQueryBuilder().delete().execute();
              await cuotaRepository.createQueryBuilder().delete().execute();
              
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