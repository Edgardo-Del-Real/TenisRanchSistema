import { Test, TestingModule } from '@nestjs/testing';
import { PagosController } from '../pagos.controller';
import { PagosService } from '../pagos.service';
import { CreatePagoTurnoDto } from '../dto/create-pago-turno.dto';
import { CreatePagoLuzDto } from '../dto/create-pago-luz.dto';

describe('PagosController', () => {
  let controller: PagosController;
  let service: PagosService;

  const mockPagosService = {
    registrarPagoTurno: jest.fn(),
    registrarPagoLuz: jest.fn(),
    obtenerPagosLuz: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PagosController],
      providers: [
        {
          provide: PagosService,
          useValue: mockPagosService,
        },
      ],
    }).compile();

    controller = module.get<PagosController>(PagosController);
    service = module.get<PagosService>(PagosService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('registrarPagoTurno', () => {
    it('should register turno payment', async () => {
      const createPagoTurnoDto: CreatePagoTurnoDto = {
        turno_id: '123e4567-e89b-12d3-a456-426614174000',
        monto: 15000,
        metodo_pago: 'efectivo',
      };
      const req = { user: { userId: 'admin-123' } };
      const expectedResult = { id: 'pago-123', ...createPagoTurnoDto };

      mockPagosService.registrarPagoTurno.mockResolvedValue(expectedResult);

      const result = await controller.registrarPagoTurno(createPagoTurnoDto, req);

      expect(result).toEqual(expectedResult);
      expect(service.registrarPagoTurno).toHaveBeenCalledWith(
        createPagoTurnoDto,
        'admin-123',
      );
    });
  });

  describe('registrarPagoLuz', () => {
    it('should register luz payment', async () => {
      const createPagoLuzDto: CreatePagoLuzDto = {
        monto: 25000,
        descripcion: 'Pago de luz enero 2024',
      };
      const req = { user: { userId: 'admin-123' } };
      const expectedResult = { id: 'pago-luz-123', ...createPagoLuzDto };

      mockPagosService.registrarPagoLuz.mockResolvedValue(expectedResult);

      const result = await controller.registrarPagoLuz(createPagoLuzDto, req);

      expect(result).toEqual(expectedResult);
      expect(service.registrarPagoLuz).toHaveBeenCalledWith(
        createPagoLuzDto,
        'admin-123',
      );
    });
  });

  describe('obtenerPagosLuz', () => {
    it('should return pagos luz', async () => {
      const expectedResult = [
        { id: '1', monto: 25000, fecha_pago: new Date('2024-01-15') },
        { id: '2', monto: 30000, fecha_pago: new Date('2024-01-10') },
      ];

      mockPagosService.obtenerPagosLuz.mockResolvedValue(expectedResult);

      const result = await controller.obtenerPagosLuz();

      expect(result).toEqual(expectedResult);
      expect(service.obtenerPagosLuz).toHaveBeenCalled();
    });
  });
});