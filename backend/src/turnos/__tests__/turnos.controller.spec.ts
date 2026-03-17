import { Test, TestingModule } from '@nestjs/testing';
import { TurnosController } from '../turnos.controller';
import { TurnosService } from '../turnos.service';
import { CreateTurnoDto } from '../dto/create-turno.dto';
import { Rol } from '../../common/enums/rol.enum';
import { EstadoTurno } from '../../common/enums/estado-turno.enum';

describe('TurnosController', () => {
  let controller: TurnosController;
  let service: TurnosService;

  const mockTurnosService = {
    create: jest.fn(),
    cancelTurno: jest.fn(),
    findTurnos: jest.fn(),
    findHistorial: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TurnosController],
      providers: [
        {
          provide: TurnosService,
          useValue: mockTurnosService,
        },
      ],
    }).compile();

    controller = module.get<TurnosController>(TurnosController);
    service = module.get<TurnosService>(TurnosService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a turno', async () => {
      const dto: CreateTurnoDto = {
        cancha_id: 'cancha-123',
        fecha_hora_inicio: '2024-01-15T10:00:00',
      };

      const mockRequest = {
        user: {
          userId: 'user-123',
          rol: Rol.NO_SOCIO,
        },
      };

      const expectedResult = {
        id: 'turno-123',
        usuario_id: 'user-123',
        cancha_id: 'cancha-123',
        fecha_hora_inicio: new Date('2024-01-15T10:00:00'),
        fecha_hora_fin: new Date('2024-01-15T11:00:00'),
        duracion_minutos: 60,
        requiere_luz: false,
        costo_turno: 1000,
        cargo_luz: 0,
      };

      mockTurnosService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(dto, mockRequest);

      expect(result).toEqual(expectedResult);
      expect(mockTurnosService.create).toHaveBeenCalledWith(
        dto,
        'user-123',
        Rol.NO_SOCIO,
      );
    });
  });

  describe('cancel', () => {
    it('should cancel a turno', async () => {
      const turnoId = 'turno-123';
      const mockRequest = {
        user: {
          userId: 'user-123',
          rol: Rol.SOCIO,
        },
      };

      const expectedResult = {
        message: 'Turno cancelado exitosamente',
        turno: {
          id: turnoId,
          estado: EstadoTurno.CANCELADO,
          cancelado_en: new Date(),
          cancelado_por: 'user-123',
          fecha_hora_inicio: new Date('2024-01-15T10:00:00'),
          cancha_id: 'cancha-123',
        },
      };

      mockTurnosService.cancelTurno.mockResolvedValue(expectedResult);

      const result = await controller.cancel(turnoId, mockRequest);

      expect(result).toEqual(expectedResult);
      expect(mockTurnosService.cancelTurno).toHaveBeenCalledWith(
        turnoId,
        'user-123',
        Rol.SOCIO,
      );
    });
  });

  describe('findTurnos', () => {
    it('should find turnos for admin with filters', async () => {
      const mockRequest = {
        user: {
          userId: 'admin-123',
          rol: Rol.ADMINISTRADOR,
        },
      };

      const expectedResult = [
        {
          id: 'turno-1',
          fecha_inicio: new Date('2024-01-15T10:00:00'),
          fecha_fin: new Date('2024-01-15T11:00:00'),
          estado: EstadoTurno.ACTIVO,
          usuario: {
            id: 'user-1',
            nombre: 'Juan',
            apellido: 'Perez',
          },
        },
      ];

      mockTurnosService.findTurnos.mockResolvedValue(expectedResult);

      const result = await controller.findTurnos(
        mockRequest,
        'Juan',
        'Perez',
        '2024-01-01',
        '2024-01-31',
      );

      expect(result).toEqual(expectedResult);
      expect(mockTurnosService.findTurnos).toHaveBeenCalledWith(
        'admin-123',
        Rol.ADMINISTRADOR,
        {
          nombre: 'Juan',
          apellido: 'Perez',
          fechaDesde: '2024-01-01',
          fechaHasta: '2024-01-31',
        },
      );
    });

    it('should find turnos for non-admin user', async () => {
      const mockRequest = {
        user: {
          userId: 'user-123',
          rol: Rol.SOCIO,
        },
      };

      const expectedResult = [
        {
          id: 'turno-1',
          fecha_inicio: new Date('2024-01-15T10:00:00'),
          fecha_fin: new Date('2024-01-15T11:00:00'),
          estado: EstadoTurno.ACTIVO,
        },
      ];

      mockTurnosService.findTurnos.mockResolvedValue(expectedResult);

      const result = await controller.findTurnos(mockRequest);

      expect(result).toEqual(expectedResult);
      expect(mockTurnosService.findTurnos).toHaveBeenCalledWith(
        'user-123',
        Rol.SOCIO,
        {
          nombre: undefined,
          apellido: undefined,
          fechaDesde: undefined,
          fechaHasta: undefined,
        },
      );
    });
  });

  describe('findHistorial', () => {
    it('should find historial for admin with filters', async () => {
      const mockRequest = {
        user: {
          userId: 'admin-123',
          rol: Rol.ADMINISTRADOR,
        },
      };

      const expectedResult = [
        {
          id: 'turno-1',
          fecha_inicio: new Date('2024-01-15T10:00:00'),
          fecha_fin: new Date('2024-01-15T11:00:00'),
          estado: EstadoTurno.CANCELADO,
          usuario: {
            id: 'user-1',
            nombre: 'Maria',
            apellido: 'Garcia',
          },
        },
      ];

      mockTurnosService.findHistorial.mockResolvedValue(expectedResult);

      const result = await controller.findHistorial(
        mockRequest,
        'Maria',
        'Garcia',
        '2024-01-01',
        '2024-01-31',
      );

      expect(result).toEqual(expectedResult);
      expect(mockTurnosService.findHistorial).toHaveBeenCalledWith(
        'admin-123',
        Rol.ADMINISTRADOR,
        {
          nombre: 'Maria',
          apellido: 'Garcia',
          fechaDesde: '2024-01-01',
          fechaHasta: '2024-01-31',
        },
      );
    });

    it('should find historial for non-admin user', async () => {
      const mockRequest = {
        user: {
          userId: 'user-123',
          rol: Rol.NO_SOCIO,
        },
      };

      const expectedResult = [
        {
          id: 'turno-1',
          fecha_inicio: new Date('2024-01-15T10:00:00'),
          fecha_fin: new Date('2024-01-15T11:00:00'),
          estado: EstadoTurno.CANCELADO,
        },
      ];

      mockTurnosService.findHistorial.mockResolvedValue(expectedResult);

      const result = await controller.findHistorial(mockRequest);

      expect(result).toEqual(expectedResult);
      expect(mockTurnosService.findHistorial).toHaveBeenCalledWith(
        'user-123',
        Rol.NO_SOCIO,
        {
          nombre: undefined,
          apellido: undefined,
          fechaDesde: undefined,
          fechaHasta: undefined,
        },
      );
    });
  });
});
