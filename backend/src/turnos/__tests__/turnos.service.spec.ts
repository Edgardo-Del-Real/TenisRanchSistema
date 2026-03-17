import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { TurnosService } from '../turnos.service';
import { Turno } from '../../entities/turno.entity';
import { Cancha } from '../../entities/cancha.entity';
import { Cuota } from '../../entities/cuota.entity';
import { PagoTurno } from '../../entities/pago-turno.entity';
import { ConfiguracionService } from '../../configuracion/configuracion.service';
import { TarifasService } from '../../tarifas/tarifas.service';
import { EstadoCancha } from '../../common/enums/estado-cancha.enum';
import { EstadoCuota } from '../../common/enums/estado-cuota.enum';
import { EstadoTurno } from '../../common/enums/estado-turno.enum';
import { TipoTarifa } from '../../common/enums/tipo-tarifa.enum';
import { Rol } from '../../common/enums/rol.enum';

describe('TurnosService', () => {
  let service: TurnosService;
  let turnoRepository: Repository<Turno>;
  let canchaRepository: Repository<Cancha>;
  let cuotaRepository: Repository<Cuota>;
  let pagoTurnoRepository: Repository<PagoTurno>;
  let configuracionService: ConfiguracionService;
  let tarifasService: TarifasService;

  const mockTurnoRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockCanchaRepository = {
    findOne: jest.fn(),
  };

  const mockCuotaRepository = {
    count: jest.fn(),
  };

  const mockPagoTurnoRepository = {
    findOne: jest.fn(),
  };

  const mockConfiguracionService = {
    getConfiguracion: jest.fn(),
  };

  const mockTarifasService = {
    findVigentes: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TurnosService,
        {
          provide: getRepositoryToken(Turno),
          useValue: mockTurnoRepository,
        },
        {
          provide: getRepositoryToken(Cancha),
          useValue: mockCanchaRepository,
        },
        {
          provide: getRepositoryToken(Cuota),
          useValue: mockCuotaRepository,
        },
        {
          provide: getRepositoryToken(PagoTurno),
          useValue: mockPagoTurnoRepository,
        },
        {
          provide: ConfiguracionService,
          useValue: mockConfiguracionService,
        },
        {
          provide: TarifasService,
          useValue: mockTarifasService,
        },
      ],
    }).compile();

    service = module.get<TurnosService>(TurnosService);
    turnoRepository = module.get<Repository<Turno>>(getRepositoryToken(Turno));
    canchaRepository = module.get<Repository<Cancha>>(getRepositoryToken(Cancha));
    cuotaRepository = module.get<Repository<Cuota>>(getRepositoryToken(Cuota));
    configuracionService = module.get<ConfiguracionService>(ConfiguracionService);
    tarifasService = module.get<TarifasService>(TarifasService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const mockConfig = {
      apertura: '08:00:00',
      cierre: '22:00:00',
      luz_inicio: '18:00:00',
      luz_fin: '22:00:00',
      duracion_semana_min: 60,
      duracion_finde_min: 90,
    };

    const mockTarifas = [
      { tipo: TipoTarifa.TURNO_NO_SOCIO, valor: 1000 },
      { tipo: TipoTarifa.LUZ, valor: 500 },
    ];

    it('should create a turno successfully for weekday', async () => {
      const dto = {
        cancha_id: 'cancha-123',
        fecha_hora_inicio: '2024-01-15T10:00:00', // Monday, 10 AM local time
      };
      const userId = 'user-123';
      const userRole = Rol.NO_SOCIO;

      const mockCancha = {
        id: 'cancha-123',
        numero: 1,
        estado: EstadoCancha.DISPONIBLE,
      };

      mockCanchaRepository.findOne.mockResolvedValue(mockCancha);
      mockConfiguracionService.getConfiguracion.mockResolvedValue(mockConfig);
      mockTurnoRepository.findOne.mockResolvedValue(null);
      mockCuotaRepository.count.mockResolvedValue(0);
      mockTarifasService.findVigentes.mockResolvedValue(mockTarifas);

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
      };
      mockTurnoRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const mockTurno = {
        id: 'turno-123',
        usuario_id: userId,
        cancha_id: dto.cancha_id,
        fecha_inicio: new Date(dto.fecha_hora_inicio),
        fecha_fin: new Date(new Date(dto.fecha_hora_inicio).getTime() + 60 * 60000),
        requiere_luz: false,
        costo_turno: 1000,
        costo_luz: 0,
        estado: EstadoTurno.ACTIVO,
        created_at: new Date(),
      };

      mockTurnoRepository.create.mockReturnValue(mockTurno);
      mockTurnoRepository.save.mockResolvedValue(mockTurno);

      const result = await service.create(dto, userId, userRole);

      expect(result.duracion_minutos).toBe(60);
      expect(result.costo_turno).toBe(1000);
      expect(result.cargo_luz).toBe(0);
      expect(mockTurnoRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when cancha does not exist', async () => {
      const dto = {
        cancha_id: 'invalid-cancha',
        fecha_hora_inicio: '2024-01-15T10:00:00',
      };

      mockCanchaRepository.findOne.mockResolvedValue(null);

      await expect(service.create(dto, 'user-123', Rol.NO_SOCIO)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when cancha is not available', async () => {
      const dto = {
        cancha_id: 'cancha-123',
        fecha_hora_inicio: '2024-01-15T10:00:00',
      };

      const mockCancha = {
        id: 'cancha-123',
        numero: 1,
        estado: EstadoCancha.MANTENIMIENTO,
      };

      mockCanchaRepository.findOne.mockResolvedValue(mockCancha);

      await expect(service.create(dto, 'user-123', Rol.NO_SOCIO)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when outside operating hours', async () => {
      const dto = {
        cancha_id: 'cancha-123',
        fecha_hora_inicio: '2024-01-15T06:00:00', // Before opening
      };

      const mockCancha = {
        id: 'cancha-123',
        numero: 1,
        estado: EstadoCancha.DISPONIBLE,
      };

      mockCanchaRepository.findOne.mockResolvedValue(mockCancha);
      mockConfiguracionService.getConfiguracion.mockResolvedValue(mockConfig);

      await expect(service.create(dto, 'user-123', Rol.NO_SOCIO)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ForbiddenException when user has 2+ pending cuotas', async () => {
      const dto = {
        cancha_id: 'cancha-123',
        fecha_hora_inicio: '2024-01-15T10:00:00',
      };

      const mockCancha = {
        id: 'cancha-123',
        numero: 1,
        estado: EstadoCancha.DISPONIBLE,
      };

      mockCanchaRepository.findOne.mockResolvedValue(mockCancha);
      mockConfiguracionService.getConfiguracion.mockResolvedValue(mockConfig);
      mockTurnoRepository.findOne.mockResolvedValue(null);

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
      };
      mockTurnoRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      mockCuotaRepository.count.mockResolvedValue(2);

      await expect(service.create(dto, 'user-123', Rol.NO_SOCIO)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should allow admin to bypass cuota check', async () => {
      const dto = {
        cancha_id: 'cancha-123',
        fecha_hora_inicio: '2024-01-15T10:00:00',
      };
      const userId = 'admin-123';
      const userRole = Rol.ADMINISTRADOR;

      const mockCancha = {
        id: 'cancha-123',
        numero: 1,
        estado: EstadoCancha.DISPONIBLE,
      };

      mockCanchaRepository.findOne.mockResolvedValue(mockCancha);
      mockConfiguracionService.getConfiguracion.mockResolvedValue(mockConfig);
      mockTurnoRepository.findOne.mockResolvedValue(null);
      mockTarifasService.findVigentes.mockResolvedValue(mockTarifas);

      const mockTurno = {
        id: 'turno-123',
        usuario_id: userId,
        cancha_id: dto.cancha_id,
        fecha_inicio: new Date(dto.fecha_hora_inicio),
        fecha_fin: new Date(new Date(dto.fecha_hora_inicio).getTime() + 60 * 60000),
        requiere_luz: false,
        costo_turno: 1000,
        costo_luz: 0,
        estado: EstadoTurno.ACTIVO,
        created_at: new Date(),
      };

      mockTurnoRepository.create.mockReturnValue(mockTurno);
      mockTurnoRepository.save.mockResolvedValue(mockTurno);

      const result = await service.create(dto, userId, userRole);

      expect(result).toBeDefined();
      expect(mockCuotaRepository.count).not.toHaveBeenCalled();
    });
  });
});
