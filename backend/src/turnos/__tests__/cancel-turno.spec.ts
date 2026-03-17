import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TurnosService } from '../turnos.service';
import { Turno } from '../../entities/turno.entity';
import { Cancha } from '../../entities/cancha.entity';
import { Cuota } from '../../entities/cuota.entity';
import { PagoTurno } from '../../entities/pago-turno.entity';
import { ConfiguracionService } from '../../configuracion/configuracion.service';
import { TarifasService } from '../../tarifas/tarifas.service';
import { EstadoTurno } from '../../common/enums/estado-turno.enum';
import { Rol } from '../../common/enums/rol.enum';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';

describe('TurnosService - cancelTurno', () => {
  let service: TurnosService;
  let turnoRepository: Repository<Turno>;

  const mockTurnoRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
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
          useValue: {},
        },
        {
          provide: getRepositoryToken(Cuota),
          useValue: {},
        },
        {
          provide: getRepositoryToken(PagoTurno),
          useValue: {},
        },
        {
          provide: ConfiguracionService,
          useValue: {},
        },
        {
          provide: TarifasService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<TurnosService>(TurnosService);
    turnoRepository = module.get<Repository<Turno>>(getRepositoryToken(Turno));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('cancelTurno', () => {
    it('should cancel turno successfully when user is owner and has sufficient anticipation', async () => {
      const turnoId = 'turno-123';
      const userId = 'user-123';
      const userRole = Rol.SOCIO;
      
      // Turno que inicia en 2 horas
      const fechaInicio = new Date(Date.now() + 2 * 60 * 60 * 1000);
      
      const mockTurno = {
        id: turnoId,
        usuario_id: userId,
        cancha_id: 'cancha-123',
        fecha_inicio: fechaInicio,
        estado: EstadoTurno.ACTIVO,
      };

      const mockTurnoActualizado = {
        ...mockTurno,
        estado: EstadoTurno.CANCELADO,
        cancelado_en: new Date(),
        cancelado_por: userId,
      };

      mockTurnoRepository.findOne.mockResolvedValue(mockTurno);
      mockTurnoRepository.save.mockResolvedValue(mockTurnoActualizado);

      const result = await service.cancelTurno(turnoId, userId, userRole);

      expect(result.message).toBe('Turno cancelado exitosamente');
      expect(result.turno.estado).toBe(EstadoTurno.CANCELADO);
      expect(result.turno.cancelado_por).toBe(userId);
      expect(mockTurnoRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          estado: EstadoTurno.CANCELADO,
          cancelado_por: userId,
        })
      );
    });

    it('should throw NotFoundException when turno does not exist', async () => {
      mockTurnoRepository.findOne.mockResolvedValue(null);

      await expect(
        service.cancelTurno('non-existent', 'user-123', Rol.SOCIO)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when turno is already cancelled', async () => {
      const mockTurno = {
        id: 'turno-123',
        usuario_id: 'user-123',
        estado: EstadoTurno.CANCELADO,
      };

      mockTurnoRepository.findOne.mockResolvedValue(mockTurno);

      await expect(
        service.cancelTurno('turno-123', 'user-123', Rol.SOCIO)
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException when user is not owner and not admin', async () => {
      const mockTurno = {
        id: 'turno-123',
        usuario_id: 'other-user',
        estado: EstadoTurno.ACTIVO,
      };

      mockTurnoRepository.findOne.mockResolvedValue(mockTurno);

      await expect(
        service.cancelTurno('turno-123', 'user-123', Rol.SOCIO)
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow admin to cancel any turno', async () => {
      const turnoId = 'turno-123';
      const adminId = 'admin-123';
      const fechaInicio = new Date(Date.now() + 2 * 60 * 60 * 1000);
      
      const mockTurno = {
        id: turnoId,
        usuario_id: 'other-user',
        cancha_id: 'cancha-123',
        fecha_inicio: fechaInicio,
        estado: EstadoTurno.ACTIVO,
      };

      const mockTurnoActualizado = {
        ...mockTurno,
        estado: EstadoTurno.CANCELADO,
        cancelado_en: new Date(),
        cancelado_por: adminId,
      };

      mockTurnoRepository.findOne.mockResolvedValue(mockTurno);
      mockTurnoRepository.save.mockResolvedValue(mockTurnoActualizado);

      const result = await service.cancelTurno(turnoId, adminId, Rol.ADMINISTRADOR);

      expect(result.message).toBe('Turno cancelado exitosamente');
      expect(result.turno.cancelado_por).toBe(adminId);
    });

    it('should throw BadRequestException when insufficient anticipation', async () => {
      const turnoId = 'turno-123';
      const userId = 'user-123';
      
      // Turno que inicia en 30 minutos (menos de 1 hora)
      const fechaInicio = new Date(Date.now() + 30 * 60 * 1000);
      
      const mockTurno = {
        id: turnoId,
        usuario_id: userId,
        cancha_id: 'cancha-123',
        fecha_inicio: fechaInicio,
        estado: EstadoTurno.ACTIVO,
      };

      mockTurnoRepository.findOne.mockResolvedValue(mockTurno);

      await expect(
        service.cancelTurno(turnoId, userId, Rol.SOCIO)
      ).rejects.toThrow(BadRequestException);
    });
  });
});