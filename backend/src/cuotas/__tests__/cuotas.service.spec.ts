import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CuotasService } from '../cuotas.service';
import { Cuota } from '../../entities/cuota.entity';
import { PagoCuota } from '../../entities/pago-cuota.entity';
import { Usuario } from '../../entities/usuario.entity';
import { Tarifa } from '../../entities/tarifa.entity';
import { EstadoCuota } from '../../common/enums/estado-cuota.enum';
import { Rol } from '../../common/enums/rol.enum';
import { TipoTarifa } from '../../common/enums/tipo-tarifa.enum';

describe('CuotasService', () => {
  let service: CuotasService;
  let cuotaRepository: Repository<Cuota>;
  let pagoCuotaRepository: Repository<PagoCuota>;
  let usuarioRepository: Repository<Usuario>;
  let tarifaRepository: Repository<Tarifa>;

  const mockCuotaRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockPagoCuotaRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockUsuarioRepository = {
    find: jest.fn(),
  };

  const mockTarifaRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CuotasService,
        {
          provide: getRepositoryToken(Cuota),
          useValue: mockCuotaRepository,
        },
        {
          provide: getRepositoryToken(PagoCuota),
          useValue: mockPagoCuotaRepository,
        },
        {
          provide: getRepositoryToken(Usuario),
          useValue: mockUsuarioRepository,
        },
        {
          provide: getRepositoryToken(Tarifa),
          useValue: mockTarifaRepository,
        },
      ],
    }).compile();

    service = module.get<CuotasService>(CuotasService);
    cuotaRepository = module.get<Repository<Cuota>>(getRepositoryToken(Cuota));
    pagoCuotaRepository = module.get<Repository<PagoCuota>>(getRepositoryToken(PagoCuota));
    usuarioRepository = module.get<Repository<Usuario>>(getRepositoryToken(Usuario));
    tarifaRepository = module.get<Repository<Tarifa>>(getRepositoryToken(Tarifa));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generarCuotasMensuales', () => {
    it('should generate cuotas for all active socios', async () => {
      const mockTarifa = {
        id: '1',
        tipo: TipoTarifa.CUOTA,
        valor: 10000,
        vigente_desde: new Date(),
      };

      const mockSocios = [
        { id: '1', nombre: 'Juan', apellido: 'Perez', rol: Rol.SOCIO, activo: true },
        { id: '2', nombre: 'Ana', apellido: 'Garcia', rol: Rol.SOCIO, activo: true },
      ];

      mockTarifaRepository.findOne.mockResolvedValue(mockTarifa);
      mockUsuarioRepository.find.mockResolvedValue(mockSocios);
      mockCuotaRepository.findOne.mockResolvedValue(null); // No existing cuotas
      mockCuotaRepository.create.mockImplementation((data) => data);
      mockCuotaRepository.save.mockResolvedValue({});

      await service.generarCuotasMensuales();

      expect(mockTarifaRepository.findOne).toHaveBeenCalledWith({
        where: { tipo: TipoTarifa.CUOTA },
        order: { vigente_desde: 'DESC' },
      });
      expect(mockUsuarioRepository.find).toHaveBeenCalledWith({
        where: { rol: Rol.SOCIO, activo: true },
      });
      expect(mockCuotaRepository.create).toHaveBeenCalledTimes(2);
      expect(mockCuotaRepository.save).toHaveBeenCalledTimes(2);
    });
  });

  describe('registrarPago', () => {
    it('should register payment and update cuota status', async () => {
      const mockCuota = {
        id: '1',
        socio_id: '1',
        mes: 1,
        anio: 2024,
        monto_total: 10000,
        monto_abonado: 0,
        estado: EstadoCuota.PENDIENTE,
        socio: { nombre: 'Juan', apellido: 'Perez' },
      };

      const mockPago = {
        cuota_id: '1',
        monto: 5000,
        fecha_pago: new Date(),
        registrado_por: 'admin-id',
      };

      mockCuotaRepository.findOne.mockResolvedValue(mockCuota);
      mockPagoCuotaRepository.create.mockReturnValue(mockPago);
      mockPagoCuotaRepository.save.mockResolvedValue(mockPago);
      mockCuotaRepository.save.mockResolvedValue({
        ...mockCuota,
        monto_abonado: 5000,
        estado: EstadoCuota.PARCIAL,
      });

      const result = await service.registrarPago('1', { monto: 5000 }, 'admin-id');

      expect(result.message).toBe('Pago registrado exitosamente');
      expect(result.cuota.estado).toBe(EstadoCuota.PARCIAL);
      expect(result.cuota.monto_abonado).toBe(5000);
      expect(result.cuota.saldo_pendiente).toBe(5000);
    });

    it('should mark cuota as PAGADA when full amount is paid', async () => {
      const mockCuota = {
        id: '1',
        socio_id: '1',
        mes: 1,
        anio: 2024,
        monto_total: 10000,
        monto_abonado: 0,
        estado: EstadoCuota.PENDIENTE,
        socio: { nombre: 'Juan', apellido: 'Perez' },
      };

      mockCuotaRepository.findOne.mockResolvedValue(mockCuota);
      mockPagoCuotaRepository.create.mockReturnValue({});
      mockPagoCuotaRepository.save.mockResolvedValue({});
      mockCuotaRepository.save.mockResolvedValue({
        ...mockCuota,
        monto_abonado: 10000,
        estado: EstadoCuota.PAGADA,
      });

      const result = await service.registrarPago('1', { monto: 10000 }, 'admin-id');

      expect(result.cuota.estado).toBe(EstadoCuota.PAGADA);
      expect(result.cuota.saldo_pendiente).toBe(0);
    });
  });

  describe('getCuotasImpagas', () => {
    it('should return count of unpaid cuotas for a socio', async () => {
      mockCuotaRepository.count.mockResolvedValue(2);

      const result = await service.getCuotasImpagas('socio-id');

      expect(result).toBe(2);
      expect(mockCuotaRepository.count).toHaveBeenCalledWith({
        where: {
          socio_id: 'socio-id',
          estado: EstadoCuota.PENDIENTE,
        },
      });
    });
  });
});