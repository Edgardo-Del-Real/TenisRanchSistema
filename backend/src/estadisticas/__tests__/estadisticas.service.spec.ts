import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EstadisticasService } from '../estadisticas.service';
import { Usuario } from '../../entities/usuario.entity';
import { Turno } from '../../entities/turno.entity';
import { Cuota } from '../../entities/cuota.entity';
import { PagoCuota } from '../../entities/pago-cuota.entity';
import { PagoLuz } from '../../entities/pago-luz.entity';
import { PagoTurno } from '../../entities/pago-turno.entity';
import { Cancha } from '../../entities/cancha.entity';
import { Rol } from '../../common/enums/rol.enum';
import { EstadoTurno } from '../../common/enums/estado-turno.enum';

describe('EstadisticasService', () => {
  let service: EstadisticasService;
  let usuarioRepository: Repository<Usuario>;
  let turnoRepository: Repository<Turno>;
  let pagoCuotaRepository: Repository<PagoCuota>;
  let pagoTurnoRepository: Repository<PagoTurno>;
  let pagoLuzRepository: Repository<PagoLuz>;

  const createMockRepository = () => ({
    count: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn(),
      getRawOne: jest.fn(),
    })),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EstadisticasService,
        {
          provide: getRepositoryToken(Usuario),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(Turno),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(Cuota),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(PagoCuota),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(PagoLuz),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(PagoTurno),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(Cancha),
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    service = module.get<EstadisticasService>(EstadisticasService);
    usuarioRepository = module.get<Repository<Usuario>>(getRepositoryToken(Usuario));
    turnoRepository = module.get<Repository<Turno>>(getRepositoryToken(Turno));
    pagoCuotaRepository = module.get<Repository<PagoCuota>>(getRepositoryToken(PagoCuota));
    pagoTurnoRepository = module.get<Repository<PagoTurno>>(getRepositoryToken(PagoTurno));
    pagoLuzRepository = module.get<Repository<PagoLuz>>(getRepositoryToken(PagoLuz));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getEstadisticasGenerales', () => {
    it('should return general statistics without date filters', async () => {
      jest.spyOn(usuarioRepository, 'count').mockResolvedValue(25);
      jest.spyOn(turnoRepository, 'count').mockResolvedValue(150);
      
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn(),
      };

      jest.spyOn(turnoRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);
      
      mockQueryBuilder.getRawMany
        .mockResolvedValueOnce([
          { numero: 1, cantidad: '50' },
          { numero: 2, cantidad: '45' },
          { numero: 3, cantidad: '40' },
        ])
        .mockResolvedValueOnce([
          { hora: 18, cantidad: '25' },
          { hora: 19, cantidad: '22' },
          { hora: 20, cantidad: '20' },
        ]);

      const result = await service.getEstadisticasGenerales({});

      expect(result).toEqual({
        totalSociosActivos: 25,
        totalTurnos: 150,
        canchasMasUtilizadas: [
          { numero: 1, cantidad: '50' },
          { numero: 2, cantidad: '45' },
          { numero: 3, cantidad: '40' },
        ],
        horasPico: [
          { hora: 18, cantidad: '25' },
          { hora: 19, cantidad: '22' },
          { hora: 20, cantidad: '20' },
        ],
      });

      expect(usuarioRepository.count).toHaveBeenCalledWith({
        where: {
          rol: Rol.SOCIO,
          activo: true,
        },
      });
    });

    it('should return general statistics with date filters', async () => {
      jest.spyOn(usuarioRepository, 'count').mockResolvedValue(25);
      jest.spyOn(turnoRepository, 'count').mockResolvedValue(50);
      
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn(),
      };

      jest.spyOn(turnoRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);
      
      mockQueryBuilder.getRawMany
        .mockResolvedValueOnce([{ numero: 1, cantidad: '20' }])
        .mockResolvedValueOnce([{ hora: 18, cantidad: '10' }]);

      const filtros = {
        fechaInicio: '2024-01-01',
        fechaFin: '2024-01-31',
      };

      const result = await service.getEstadisticasGenerales(filtros);

      expect(result.totalSociosActivos).toBe(25);
      expect(result.totalTurnos).toBe(50);
      expect(turnoRepository.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          estado: EstadoTurno.ACTIVO,
          fecha_inicio: expect.any(Object),
        }),
      });
    });
  });

  describe('getEstadisticasFinancieras', () => {
    it('should return financial statistics', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn(),
      };

      jest.spyOn(pagoCuotaRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);
      jest.spyOn(pagoTurnoRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);
      jest.spyOn(turnoRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);
      jest.spyOn(pagoLuzRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);
      
      mockQueryBuilder.getRawOne
        .mockResolvedValueOnce({ total: '150000' }) // recaudacionCuotas
        .mockResolvedValueOnce({ total: '75000' })  // recaudacionTurnosNoSocio
        .mockResolvedValueOnce({ total: '25000' })  // cargosLuz
        .mockResolvedValueOnce({ total: '30000' }); // pagosLuz

      const result = await service.getEstadisticasFinancieras({});

      expect(result).toEqual({
        recaudacionCuotas: 150000,
        recaudacionTurnosNoSocio: 75000,
        cargosLuz: 25000,
        pagosLuz: 30000,
      });
    });

    it('should handle null values in financial statistics', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn(),
      };

      jest.spyOn(pagoCuotaRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);
      jest.spyOn(pagoTurnoRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);
      jest.spyOn(turnoRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);
      jest.spyOn(pagoLuzRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);
      
      mockQueryBuilder.getRawOne
        .mockResolvedValueOnce({ total: null })
        .mockResolvedValueOnce({ total: null })
        .mockResolvedValueOnce({ total: null })
        .mockResolvedValueOnce({ total: null });

      const result = await service.getEstadisticasFinancieras({});

      expect(result).toEqual({
        recaudacionCuotas: 0,
        recaudacionTurnosNoSocio: 0,
        cargosLuz: 0,
        pagosLuz: 0,
      });
    });
  });
});