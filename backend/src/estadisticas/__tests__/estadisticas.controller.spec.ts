import { Test, TestingModule } from '@nestjs/testing';
import { EstadisticasController } from '../estadisticas.controller';
import { EstadisticasService } from '../estadisticas.service';

describe('EstadisticasController', () => {
  let controller: EstadisticasController;
  let service: EstadisticasService;

  const mockEstadisticasService = {
    getEstadisticasGenerales: jest.fn(),
    getEstadisticasFinancieras: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EstadisticasController],
      providers: [
        {
          provide: EstadisticasService,
          useValue: mockEstadisticasService,
        },
      ],
    }).compile();

    controller = module.get<EstadisticasController>(EstadisticasController);
    service = module.get<EstadisticasService>(EstadisticasService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getEstadisticasGenerales', () => {
    it('should return general statistics', async () => {
      const mockResult = {
        totalSociosActivos: 25,
        totalTurnos: 150,
        canchasMasUtilizadas: [{ numero: 1, cantidad: '50' }],
        horasPico: [{ hora: 18, cantidad: '25' }],
      };

      mockEstadisticasService.getEstadisticasGenerales.mockResolvedValue(mockResult);

      const filtros = { fechaInicio: '2024-01-01', fechaFin: '2024-01-31' };
      const result = await controller.getEstadisticasGenerales(filtros);

      expect(result).toEqual(mockResult);
      expect(service.getEstadisticasGenerales).toHaveBeenCalledWith(filtros);
    });
  });

  describe('getEstadisticasFinancieras', () => {
    it('should return financial statistics', async () => {
      const mockResult = {
        recaudacionCuotas: 150000,
        recaudacionTurnosNoSocio: 75000,
        cargosLuz: 25000,
        pagosLuz: 30000,
      };

      mockEstadisticasService.getEstadisticasFinancieras.mockResolvedValue(mockResult);

      const filtros = { fechaInicio: '2024-01-01', fechaFin: '2024-01-31' };
      const result = await controller.getEstadisticasFinancieras(filtros);

      expect(result).toEqual(mockResult);
      expect(service.getEstadisticasFinancieras).toHaveBeenCalledWith(filtros);
    });
  });
});