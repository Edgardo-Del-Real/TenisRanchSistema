import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PagosService } from '../pagos.service';
import { PagoTurno, PagoLuz, Turno } from '../../entities';
import { CreatePagoTurnoDto } from '../dto/create-pago-turno.dto';
import { CreatePagoLuzDto } from '../dto/create-pago-luz.dto';
import { Rol } from '../../common/enums/rol.enum';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('PagosService', () => {
  let service: PagosService;
  let pagoTurnoRepository: Repository<PagoTurno>;
  let pagoLuzRepository: Repository<PagoLuz>;
  let turnoRepository: Repository<Turno>;

  const mockPagoTurnoRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  const mockPagoLuzRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  const mockTurnoRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PagosService,
        {
          provide: getRepositoryToken(PagoTurno),
          useValue: mockPagoTurnoRepository,
        },
        {
          provide: getRepositoryToken(PagoLuz),
          useValue: mockPagoLuzRepository,
        },
        {
          provide: getRepositoryToken(Turno),
          useValue: mockTurnoRepository,
        },
      ],
    }).compile();

    service = module.get<PagosService>(PagosService);
    pagoTurnoRepository = module.get<Repository<PagoTurno>>(getRepositoryToken(PagoTurno));
    pagoLuzRepository = module.get<Repository<PagoLuz>>(getRepositoryToken(PagoLuz));
    turnoRepository = module.get<Repository<Turno>>(getRepositoryToken(Turno));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('registrarPagoTurno', () => {
    const createPagoTurnoDto: CreatePagoTurnoDto = {
      turno_id: '123e4567-e89b-12d3-a456-426614174000',
      monto: 15000,
      metodo_pago: 'efectivo',
    };
    const userId = 'admin-123';

    it('should register payment for No_Socio turno successfully', async () => {
      const mockTurno = {
        id: createPagoTurnoDto.turno_id,
        usuario: { rol: Rol.NO_SOCIO },
      };
      const mockPagoTurno = { id: 'pago-123', ...createPagoTurnoDto };

      mockTurnoRepository.findOne.mockResolvedValue(mockTurno);
      mockPagoTurnoRepository.findOne.mockResolvedValue(null);
      mockPagoTurnoRepository.create.mockReturnValue(mockPagoTurno);
      mockPagoTurnoRepository.save.mockResolvedValue(mockPagoTurno);

      const result = await service.registrarPagoTurno(createPagoTurnoDto, userId);

      expect(result).toEqual(mockPagoTurno);
      expect(mockTurnoRepository.findOne).toHaveBeenCalledWith({
        where: { id: createPagoTurnoDto.turno_id },
        relations: ['usuario'],
      });
      expect(mockPagoTurnoRepository.create).toHaveBeenCalledWith({
        turno_id: createPagoTurnoDto.turno_id,
        monto: createPagoTurnoDto.monto,
        metodo_pago: createPagoTurnoDto.metodo_pago,
        fecha_pago: expect.any(Date),
        registrado_por: userId,
      });
    });

    it('should throw NotFoundException when turno does not exist', async () => {
      mockTurnoRepository.findOne.mockResolvedValue(null);

      await expect(
        service.registrarPagoTurno(createPagoTurnoDto, userId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when turno belongs to Socio', async () => {
      const mockTurno = {
        id: createPagoTurnoDto.turno_id,
        usuario: { rol: Rol.SOCIO },
      };

      mockTurnoRepository.findOne.mockResolvedValue(mockTurno);

      await expect(
        service.registrarPagoTurno(createPagoTurnoDto, userId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when payment already exists', async () => {
      const mockTurno = {
        id: createPagoTurnoDto.turno_id,
        usuario: { rol: Rol.NO_SOCIO },
      };
      const existingPago = { id: 'existing-pago' };

      mockTurnoRepository.findOne.mockResolvedValue(mockTurno);
      mockPagoTurnoRepository.findOne.mockResolvedValue(existingPago);

      await expect(
        service.registrarPagoTurno(createPagoTurnoDto, userId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('registrarPagoLuz', () => {
    const createPagoLuzDto: CreatePagoLuzDto = {
      monto: 25000,
      descripcion: 'Pago de luz enero 2024',
    };
    const userId = 'admin-123';

    it('should register luz payment successfully', async () => {
      const mockPagoLuz = { id: 'pago-luz-123', ...createPagoLuzDto };

      mockPagoLuzRepository.create.mockReturnValue(mockPagoLuz);
      mockPagoLuzRepository.save.mockResolvedValue(mockPagoLuz);

      const result = await service.registrarPagoLuz(createPagoLuzDto, userId);

      expect(result).toEqual(mockPagoLuz);
      expect(mockPagoLuzRepository.create).toHaveBeenCalledWith({
        monto: createPagoLuzDto.monto,
        descripcion: createPagoLuzDto.descripcion,
        fecha_pago: expect.any(Date),
        registrado_por: userId,
      });
    });
  });

  describe('obtenerPagosLuz', () => {
    it('should return pagos luz in descending order', async () => {
      const mockPagosLuz = [
        { id: '1', monto: 25000, fecha_pago: new Date('2024-01-15') },
        { id: '2', monto: 30000, fecha_pago: new Date('2024-01-10') },
      ];

      mockPagoLuzRepository.find.mockResolvedValue(mockPagosLuz);

      const result = await service.obtenerPagosLuz();

      expect(result).toEqual(mockPagosLuz);
      expect(mockPagoLuzRepository.find).toHaveBeenCalledWith({
        relations: ['registrado_por_usuario'],
        order: { fecha_pago: 'DESC' },
      });
    });
  });
});