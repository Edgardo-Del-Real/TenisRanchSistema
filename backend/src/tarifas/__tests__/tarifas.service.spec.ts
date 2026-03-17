import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { TarifasService } from '../tarifas.service';
import { Tarifa } from '../../entities/tarifa.entity';
import { TipoTarifa } from '../../common/enums/tipo-tarifa.enum';

describe('TarifasService', () => {
  let service: TarifasService;
  let repository: Repository<Tarifa>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TarifasService,
        {
          provide: getRepositoryToken(Tarifa),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TarifasService>(TarifasService);
    repository = module.get<Repository<Tarifa>>(getRepositoryToken(Tarifa));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findVigentes', () => {
    it('should return vigentes tarifas for all types', async () => {
      const mockTarifas = [
        {
          id: '1',
          tipo: TipoTarifa.TURNO_NO_SOCIO,
          valor: 1000,
          vigente_desde: new Date(),
        },
        {
          id: '2',
          tipo: TipoTarifa.LUZ,
          valor: 500,
          vigente_desde: new Date(),
        },
        {
          id: '3',
          tipo: TipoTarifa.CUOTA,
          valor: 5000,
          vigente_desde: new Date(),
        },
      ];

      jest.spyOn(repository, 'findOne')
        .mockResolvedValueOnce(mockTarifas[0] as Tarifa)
        .mockResolvedValueOnce(mockTarifas[1] as Tarifa)
        .mockResolvedValueOnce(mockTarifas[2] as Tarifa);

      const result = await service.findVigentes();

      expect(result).toHaveLength(3);
      expect(result[0].tipo).toBe(TipoTarifa.TURNO_NO_SOCIO);
      expect(result[1].tipo).toBe(TipoTarifa.LUZ);
      expect(result[2].tipo).toBe(TipoTarifa.CUOTA);
    });
  });

  describe('updateTarifa', () => {
    it('should create new tarifa with valid tipo', async () => {
      const mockTarifa = {
        id: '1',
        tipo: TipoTarifa.TURNO_NO_SOCIO,
        valor: 1500,
        vigente_desde: new Date(),
        modificado_por: 'user-id',
      };

      jest.spyOn(repository, 'create').mockReturnValue(mockTarifa as Tarifa);
      jest.spyOn(repository, 'save').mockResolvedValue(mockTarifa as Tarifa);

      const result = await service.updateTarifa(
        TipoTarifa.TURNO_NO_SOCIO,
        { valor: 1500 },
        'user-id',
      );

      expect(result).toEqual(mockTarifa);
      expect(repository.create).toHaveBeenCalledWith({
        tipo: TipoTarifa.TURNO_NO_SOCIO,
        valor: 1500,
        vigente_desde: expect.any(Date),
        modificado_por: 'user-id',
      });
    });

    it('should throw BadRequestException for invalid tipo', async () => {
      await expect(
        service.updateTarifa('INVALID_TYPE', { valor: 1500 }, 'user-id'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getHistorial', () => {
    it('should return historial with filters', async () => {
      const mockHistorial = [
        {
          id: '1',
          tipo: TipoTarifa.TURNO_NO_SOCIO,
          valor: 1000,
          vigente_desde: new Date('2024-01-01'),
        },
        {
          id: '2',
          tipo: TipoTarifa.TURNO_NO_SOCIO,
          valor: 1500,
          vigente_desde: new Date('2024-02-01'),
        },
      ];

      const mockQueryBuilder = {
        createQueryBuilder: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockHistorial),
      };

      jest.spyOn(repository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      const result = await service.getHistorial('2024-01-01', '2024-12-31', 1000, 2000);

      expect(result).toEqual(mockHistorial);
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalled();
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('tarifa.vigente_desde', 'DESC');
    });
  });
});
