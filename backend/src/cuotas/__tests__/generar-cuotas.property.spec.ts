import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fc from 'fast-check';
import * as bcrypt from 'bcrypt';
import { CuotasService } from '../cuotas.service';
import { Cuota } from '../../entities/cuota.entity';
import { PagoCuota } from '../../entities/pago-cuota.entity';
import { Usuario } from '../../entities/usuario.entity';
import { Tarifa } from '../../entities/tarifa.entity';
import { Rol } from '../../common/enums/rol.enum';
import { EstadoCuota } from '../../common/enums/estado-cuota.enum';

describe('CuotasService - Generar Cuotas Property Tests', () => {
  let service: CuotasService;
  let cuotaRepository: Repository<Cuota>;
  let usuarioRepository: Repository<Usuario>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CuotasService,
        {
          provide: getRepositoryToken(Cuota),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(PagoCuota),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Usuario),
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Tarifa),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CuotasService>(CuotasService);
    cuotaRepository = module.get<Repository<Cuota>>(getRepositoryToken(Cuota));
    usuarioRepository = module.get<Repository<Usuario>>(getRepositoryToken(Usuario));
  });

  describe('generarCuotasManuales', () => {
    it('should generate cuotas for all active socios with valid amount', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            monto: fc.integer({ min: 1000, max: 50000 }),
            sociosCount: fc.integer({ min: 1, max: 10 }),
          }),
          async (data) => {
            // Arrange
            const socios = await Promise.all(
              Array.from({ length: data.sociosCount }, async (_, i) => ({
                id: `socio-${i}`,
                nombre: `Socio${i}`,
                apellido: `Test${i}`,
                email: `socio${i}@test.com`,
                password_hash: await bcrypt.hash('password123', 10),
                telefono: '1234567890',
                rol: Rol.SOCIO,
                activo: true,
                created_at: new Date(),
                updated_at: new Date(),
              }))
            );

            jest.spyOn(usuarioRepository, 'find').mockResolvedValue(socios);
            jest.spyOn(cuotaRepository, 'findOne').mockResolvedValue(null); // No existing cuotas
            jest.spyOn(cuotaRepository, 'create').mockImplementation((cuota) => cuota as any);
            jest.spyOn(cuotaRepository, 'save').mockResolvedValue({} as any);

            // Act
            const result = await service.generarCuotasManuales(data.monto);

            // Assert
            expect(result.cuotasGeneradas).toBe(data.sociosCount);
            expect(result.message).toContain(`${data.sociosCount} socios activos`);
            expect(cuotaRepository.create).toHaveBeenCalledTimes(data.sociosCount);
            expect(cuotaRepository.save).toHaveBeenCalledTimes(data.sociosCount);

            // Verify each cuota was created with correct data
            for (let i = 0; i < data.sociosCount; i++) {
              expect(cuotaRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                  socio_id: `socio-${i}`,
                  monto_total: data.monto,
                  monto_abonado: 0,
                  estado: EstadoCuota.PENDIENTE,
                })
              );
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not generate duplicate cuotas for same month/year', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            monto: fc.integer({ min: 1000, max: 50000 }),
            sociosWithCuotas: fc.integer({ min: 1, max: 5 }),
            sociosWithoutCuotas: fc.integer({ min: 1, max: 5 }),
          }),
          async (data) => {
            // Arrange
            const totalSocios = data.sociosWithCuotas + data.sociosWithoutCuotas;
            const socios = await Promise.all(
              Array.from({ length: totalSocios }, async (_, i) => ({
                id: `socio-${i}`,
                nombre: `Socio${i}`,
                apellido: `Test${i}`,
                email: `socio${i}@test.com`,
                password_hash: await bcrypt.hash('password123', 10),
                telefono: '1234567890',
                rol: Rol.SOCIO,
                activo: true,
                created_at: new Date(),
                updated_at: new Date(),
              }))
            );

            jest.spyOn(usuarioRepository, 'find').mockResolvedValue(socios);
            
            // Mock existing cuotas for first N socios
            jest.spyOn(cuotaRepository, 'findOne').mockImplementation(async (options: any) => {
              const socioIndex = parseInt(options.where.socio_id.split('-')[1]);
              return socioIndex < data.sociosWithCuotas ? ({} as any) : null;
            });

            jest.spyOn(cuotaRepository, 'create').mockImplementation((cuota) => cuota as any);
            jest.spyOn(cuotaRepository, 'save').mockResolvedValue({} as any);

            // Act
            const result = await service.generarCuotasManuales(data.monto);

            // Assert
            expect(result.cuotasGeneradas).toBe(data.sociosWithoutCuotas);
            expect(cuotaRepository.create).toHaveBeenCalledTimes(data.sociosWithoutCuotas);
            expect(cuotaRepository.save).toHaveBeenCalledTimes(data.sociosWithoutCuotas);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should only generate cuotas for active socios', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            monto: fc.integer({ min: 1000, max: 50000 }),
            activeSocios: fc.integer({ min: 1, max: 5 }),
            inactiveSocios: fc.integer({ min: 1, max: 5 }),
          }),
          async (data) => {
            // Arrange
            const activeSocios = await Promise.all(
              Array.from({ length: data.activeSocios }, async (_, i) => ({
                id: `active-socio-${i}`,
                nombre: `ActiveSocio${i}`,
                apellido: `Test${i}`,
                email: `active${i}@test.com`,
                password_hash: await bcrypt.hash('password123', 10),
                telefono: '1234567890',
                rol: Rol.SOCIO,
                activo: true,
                created_at: new Date(),
                updated_at: new Date(),
              }))
            );

            const inactiveSocios = await Promise.all(
              Array.from({ length: data.inactiveSocios }, async (_, i) => ({
                id: `inactive-socio-${i}`,
                nombre: `InactiveSocio${i}`,
                apellido: `Test${i}`,
                email: `inactive${i}@test.com`,
                password_hash: await bcrypt.hash('password123', 10),
                telefono: '1234567890',
                rol: Rol.SOCIO,
                activo: false,
                created_at: new Date(),
                updated_at: new Date(),
              }))
            );

            const socios = [...activeSocios, ...inactiveSocios];

            // Mock repository to return only active socios
            jest.spyOn(usuarioRepository, 'find').mockResolvedValue(activeSocios);
            jest.spyOn(cuotaRepository, 'findOne').mockResolvedValue(null);
            jest.spyOn(cuotaRepository, 'create').mockImplementation((cuota) => cuota as any);
            jest.spyOn(cuotaRepository, 'save').mockResolvedValue({} as any);

            // Act
            const result = await service.generarCuotasManuales(data.monto);

            // Assert
            expect(result.cuotasGeneradas).toBe(data.activeSocios);
            expect(usuarioRepository.find).toHaveBeenCalledWith({
              where: { rol: Rol.SOCIO, activo: true },
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});