import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { CanchasService } from '../canchas.service';
import { Cancha } from '../../entities/cancha.entity';
import { HistorialCancha } from '../../entities/historial-cancha.entity';
import { EstadoCancha } from '../../common/enums/estado-cancha.enum';

describe('CanchasService', () => {
  let service: CanchasService;
  let canchaRepository: Repository<Cancha>;
  let historialRepository: Repository<HistorialCancha>;

  const mockCanchaRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockHistorialRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CanchasService,
        {
          provide: getRepositoryToken(Cancha),
          useValue: mockCanchaRepository,
        },
        {
          provide: getRepositoryToken(HistorialCancha),
          useValue: mockHistorialRepository,
        },
      ],
    }).compile();

    service = module.get<CanchasService>(CanchasService);
    canchaRepository = module.get<Repository<Cancha>>(getRepositoryToken(Cancha));
    historialRepository = module.get<Repository<HistorialCancha>>(
      getRepositoryToken(HistorialCancha),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all canchas', async () => {
      const mockCanchas = [
        { id: '1', numero: 1, estado: EstadoCancha.DISPONIBLE },
        { id: '2', numero: 2, estado: EstadoCancha.MANTENIMIENTO },
      ];
      mockCanchaRepository.find.mockResolvedValue(mockCanchas);

      const result = await service.findAll();

      expect(result).toEqual(mockCanchas);
      expect(mockCanchaRepository.find).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateEstado', () => {
    it('should update cancha estado and create history record', async () => {
      const canchaId = 'cancha-123';
      const userId = 'user-123';
      const mockCancha = {
        id: canchaId,
        numero: 1,
        estado: EstadoCancha.DISPONIBLE,
        razon_estado: null,
      };
      const dto = {
        estado: EstadoCancha.MANTENIMIENTO,
        razon: 'Reparación de superficie',
      };

      mockCanchaRepository.findOne.mockResolvedValue(mockCancha);
      mockHistorialRepository.create.mockReturnValue({
        cancha_id: canchaId,
        estado_anterior: EstadoCancha.DISPONIBLE,
        estado_nuevo: dto.estado,
        razon: dto.razon,
        cambiado_por: userId,
      });
      mockHistorialRepository.save.mockResolvedValue({});
      mockCanchaRepository.save.mockResolvedValue({
        ...mockCancha,
        estado: dto.estado,
        razon_estado: dto.razon,
      });

      const result = await service.updateEstado(canchaId, dto, userId);

      expect(result.estado).toBe(dto.estado);
      expect(result.razon_estado).toBe(dto.razon);
      expect(mockHistorialRepository.create).toHaveBeenCalledWith({
        cancha_id: canchaId,
        estado_anterior: EstadoCancha.DISPONIBLE,
        estado_nuevo: dto.estado,
        razon: dto.razon,
        cambiado_por: userId,
      });
      expect(mockHistorialRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException when cancha does not exist', async () => {
      mockCanchaRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateEstado('invalid-id', { estado: EstadoCancha.MANTENIMIENTO, razon: 'test' }, 'user-123'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getHistorial', () => {
    it('should return historial for a cancha', async () => {
      const canchaId = 'cancha-123';
      const mockCancha = { id: canchaId, numero: 1, estado: EstadoCancha.DISPONIBLE };
      const mockHistorial = [
        {
          id: 'hist-1',
          cancha_id: canchaId,
          estado_anterior: EstadoCancha.DISPONIBLE,
          estado_nuevo: EstadoCancha.MANTENIMIENTO,
          razon: 'Reparación',
          fecha_cambio: new Date(),
        },
      ];

      mockCanchaRepository.findOne.mockResolvedValue(mockCancha);
      mockHistorialRepository.find.mockResolvedValue(mockHistorial);

      const result = await service.getHistorial(canchaId);

      expect(result).toEqual(mockHistorial);
      expect(mockHistorialRepository.find).toHaveBeenCalledWith({
        where: { cancha_id: canchaId },
        relations: ['cambiado_por_usuario'],
        order: { fecha_cambio: 'DESC' },
      });
    });

    it('should throw NotFoundException when cancha does not exist', async () => {
      mockCanchaRepository.findOne.mockResolvedValue(null);

      await expect(service.getHistorial('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });
});
